const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');
const jwt = require('jsonwebtoken');
const { User, Product, Bid, Report, Order, Ad } = require("./models/arts.js");

// ✅ إضافة الرصيد إلى المحفظة (الكود الأصلي - يتم الإضافة قبل الدفع)
router.post('/create-wallet-session', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    } catch {
      return res.status(401).json({ error: 'توكن غير صالح' });
    }

    const user = await User.findOne({ username: decoded.username });
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const amount = parseFloat(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'قيمة غير صالحة' });
    }

    const depositAmount = parseFloat(amount * 3);
    const oldBalance = user.WalletBalance || 0;
    user.WalletBalance = oldBalance + depositAmount;
    await user.save();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'إضافة رصيد إلى المحفظة',
              description: `إضافة ${amount} دولار إلى محفظتك`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:5173/profile?updated=true',
      cancel_url: 'http://localhost:5173/profile',
      customer_email: user.email,
      metadata: {
        userId: user._id.toString(),
        username: user.username,
        amount: amount.toString(),
        type: 'wallet_deposit'
      }
    });

    res.json({ 
      id: session.id,
      url: session.url 
    });

  } catch (err) {
    console.error('❌ Stripe error:', err);
    res.status(500).json({ 
      error: 'حدث خطأ أثناء إنشاء جلسة الدفع',
      details: err.message 
    });
  }
});

// =============================================
// ✅ شراء منتج عبر Stripe (تم التعديل)
// =============================================
router.post('/create-product-session', async (req, res) => {
  try {
    // 1. التحقق من التوكن
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    } catch {
      return res.status(401).json({ error: 'توكن غير صالح' });
    }

    const user = await User.findOne({ username: decoded.username });
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // 2. استلام البيانات
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'معرف المنتج مطلوب' });
    }

    // 3. جلب المنتج
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    // 4. التحققات
    if (!product.fixedPrice || product.fixedPrice <= 0) {
      return res.status(400).json({ error: 'هذا المنتج ليس للبيع بسعر ثابت' });
    }
    if (product.sellerId.toString() === user._id.toString()) {
      return res.status(400).json({ error: 'لا يمكنك شراء منتجك الخاص' });
    }
    // ✅ التحقق من expired بدلاً من sold
    if (product.status === 'expired' || product.quantity < quantity) {
      return res.status(400).json({ error: 'المنتج غير متوفر حالياً' });
    }

    // 5. خصم الكمية وتحديث الحالة إلى expired إذا أصبحت 0
    product.quantity -= quantity;
    if (product.quantity === 0) {
      product.status = 'expired';
    }
    await product.save();

    // 6. إنشاء Bid
    const totalPrice = product.fixedPrice * quantity;
    const bid = new Bid({
      ProductId: product._id,
      userId: user._id,
      bidAmount: totalPrice,
      bidType: 'fixed',
      bidTime: new Date()
    });
    await bid.save();
    const deliveryUser = await User.findOne({ userType: "delivery" });
    const deliveryId = deliveryUser ? deliveryUser._id : null;
    // 7. إنشاء Order (باستخدام الحقول الموجودة فقط في الـ Schema)
    const order = new Order({
      productId: product._id,
      bidId: bid._id,
      deliveryId: deliveryId, // يمكن تعيين مندوب لاحقاً
      deliveryStatus: 'pending',
        paymentMethod: 'card',        // أو 'card' حسب اختيار المستخدم
    });
    await order.save();

    // 8. إنشاء Report
    const report = new Report({
      productId: product._id,
      bidId: bid._id,
      sellerId: product.sellerId,
      buyerId: user._id,
      deliveryId: deliveryId,
      deliveryStatus: 'pending',
      bidType: 'fixed',
      paid: true,
      createdAt: new Date()
    });
    await report.save();

    // 9. حساب السعر بالدولار لجلسة الدفع
    const exchangeRate = 3.689;
    const priceInUSD = totalPrice / exchangeRate;

    // 10. إنشاء جلسة الدفع
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.productName,
              description: `${product.description || ''} (الكمية: ${quantity})`,
            },
            unit_amount: Math.round(priceInUSD * 100),
          },
          quantity: 1,
        },
      ],
     success_url: 'http://localhost:5173',
      cancel_url: 'http://localhost:5173',
      customer_email: user.email,
      metadata: {
        type: 'product_purchase',
        productId: product._id.toString(),
        sellerId: product.sellerId.toString(),
        buyerId: user._id.toString(),
        quantity: quantity.toString(),
        amount: totalPrice.toString(),
      },
    });

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (err) {
    console.error('❌ Stripe error (product):', err);
    res.status(500).json({ 
      error: 'حدث خطأ أثناء إنشاء جلسة الدفع',
      details: err.message 
    });
  }
});

// ✅ Webhook (لشحن المحفظة فقط)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('📨 تم استقبال Webhook');

  let event;
  try {
    event = JSON.parse(req.body.toString());
    console.log('📨 نوع الحدث:', event.type);
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    if (metadata.type === 'wallet_deposit') {
      const { userId, username, amount } = metadata;
      if (!userId || !amount) {
        console.error('❌ بيانات مفقودة في metadata للمحفظة');
        return res.status(400).send('Missing metadata');
      }

      console.log(`💰 جارٍ معالجة الدفع للمستخدم: ${username || userId}`);

      try {
        const user = await User.findById(userId);
        if (!user) {
          console.error(`❌ المستخدم غير موجود: ${userId}`);
          return res.status(404).send('User not found');
        }

        const depositAmount = parseFloat(amount);
        const oldBalance = user.WalletBalance || 0;
        user.WalletBalance = oldBalance + depositAmount;
        await user.save();

        console.log(`✅ تم إضافة ${depositAmount} دولار إلى محفظة ${user.username}`);
        console.log(`💰 الرصيد: ${oldBalance} → ${user.WalletBalance}`);

      } catch (error) {
        console.error('❌ خطأ في تحديث المحفظة:', error);
        return res.status(500).send('Error updating wallet');
      }
    }
  }

  res.json({ received: true });
});

// ✅ Route لجلب بيانات المستخدم الحالي
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    } catch {
      return res.status(401).json({ error: 'توكن غير صالح' });
    }

    const user = await User.findOne({ username: decoded.username }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json(user);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'حدث خطأ في جلب البيانات' });
  }
});

module.exports = router;