// webhook.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// ✅ التحقق من وجود المفتاح السري
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY is not defined in .env file');
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { User } = require("./models/arts.js"); // ✅ استيراد User فقط

// ✅ Webhook endpoint
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // ✅ التحقق من وجود webhook secret
        if (!webhookSecret) {
            console.warn('⚠️ STRIPE_WEBHOOK_SECRET غير مضبوط، يتم تخطي التحقق من التوقيع');
            // ✅ للتطوير فقط - تخطي التحقق
            event = JSON.parse(req.body.toString());
        } else {
            // ✅ التحقق من التوقيع في الإنتاج
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        }
    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`📨 Webhook event received: ${event.type}`);

    // ✅ معالجة حدث نجاح الدفع
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // ✅ استخراج البيانات من metadata
        const { userId, username, amount } = session.metadata || {};
        
        // ✅ التحقق من وجود البيانات المطلوبة
        if (!userId || !amount) {
            console.error('❌ Missing metadata: userId or amount');
            return res.status(400).send('Missing metadata');
        }
        
        try {
            // ✅ البحث عن المستخدم
            const user = await User.findById(userId);
            if (!user) {
                console.error(`❌ User not found: ${userId}`);
                return res.status(404).send('User not found');
            }

            // ✅ إضافة المبلغ إلى المحفظة
            const depositAmount = parseFloat(amount);
            const oldBalance = user.WalletBalance || 0;
            user.WalletBalance = oldBalance + depositAmount;
            
            // ✅ حفظ التحديث
            await user.save();

            // ✅ تسجيل العملية
            console.log(`✅ تم إضافة ${depositAmount} دولار إلى محفظة ${username || user.username}`);
            console.log(`💰 الرصيد القديم: ${oldBalance}, الرصيد الجديد: ${user.WalletBalance}`);

            // ✅ يمكنك إضافة سجل في قاعدة البيانات هنا
            // await Transaction.create({ 
            //     userId: user._id, 
            //     type: 'deposit', 
            //     amount: depositAmount,
            //     sessionId: session.id,
            //     status: 'completed'
            // });

        } catch (error) {
            console.error('❌ Error updating wallet:', error);
            return res.status(500).send('Error updating wallet');
        }
    }

    res.json({ received: true });
});

module.exports = router;