const { User, Product, Bid, Order } = require("../models/arts.js");
const userController = require("./userController");
const mongoose = require('mongoose'); // تأكد من وجود هذا السطر في أعلى الملف

// =============================================
// ✅ دالة التحقق من الصلاحيات (للملف الشخصي)
// =============================================
const ensureOwnerOrAdmin = (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: 'غير مصرح' });
        return false;
    }

    if (req.user.userType !== 'admin' && req.user.username !== req.params.username) {
        res.status(403).json({ error: 'ليس لديك الصلاحيات المطلوبة' });
        return false;
    }

    return true;
};

// =============================================
// ✅ دوال الملف الشخصي (موجودة)
// =============================================
exports.registerCustomer = async (req, res) => {
    req.body.userType = "customer";
    return userController.createUser(req, res);
};

exports.loginCustomer = async (req, res) => {
    return userController.loginUser(req, res);
};

exports.getCustomerProfile = async (req, res) => {
    if (!ensureOwnerOrAdmin(req, res)) return;
    return userController.getUserByUsername(req, res);
};

exports.updateCustomerProfile = async (req, res) => {
    if (!ensureOwnerOrAdmin(req, res)) return;
    return userController.updateUser(req, res);
};

// =============================================
// ✅ ✅ دوال جديدة للمزادات والمشتريات
// =============================================

/**
 * جلب المزايدات التي شارك فيها العميل
 */
exports.getMyBids = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. جلب جميع عروض المستخدم (معرفات المنتجات فقط)
        const userBids = await Bid.find({ userId }).select('ProductId bidAmount');
        if (userBids.length === 0) {
            return res.json({
                success: true,
                count: 0,
                products: [],
                message: 'لم تشارك في أي مزايدة بعد.'
            });
        }

        // استخراج معرفات المنتجات الفريدة
        const productIds = [...new Set(userBids.map(b => b.ProductId.toString()))];

        // 2. جلب تفاصيل هذه المنتجات
        const products = await Product.find({ _id: { $in: productIds } })
            .populate('sellerId', 'username email phone');

        // 3. جلب أعلى عرض لكل منتج من هذه المنتجات (باستخدام Aggregation)
        const topBids = await Bid.aggregate([
            { $match: { ProductId: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) } } },
            { $sort: { bidAmount: -1 } },
            { $group: {
                _id: '$ProductId',
                highestBid: { $first: '$bidAmount' },
                highestBidderId: { $first: '$userId' }
            }}
        ]);

        // تحويل إلى خريطة للوصول السريع
        const topBidsMap = {};
        topBids.forEach(item => {
            topBidsMap[item._id.toString()] = {
                amount: item.highestBid,
                userId: item.highestBidderId.toString()
            };
        });

        // 4. حساب أعلى عرض وضعه المستخدم لكل منتج
        const userBidsMap = {};
        userBids.forEach(b => {
            const pid = b.ProductId.toString();
            if (!userBidsMap[pid] || userBidsMap[pid] < b.bidAmount) {
                userBidsMap[pid] = b.bidAmount;
            }
        });

        // 5. تصنيف النتائج حسب الحالة
        const now = new Date();
        const result = products.map(product => {
            const productIdStr = product._id.toString();
            const myHighestBid = userBidsMap[productIdStr] || 0;
            const topBid = topBidsMap[productIdStr];
            const highestAmount = topBid ? topBid.amount : 0;
            const highestBidderId = topBid ? topBid.userId : null;

            let status = '';
            let message = '';

            const isActive = product.status === 'active';
            const isTimeEnded = product.auctionEndTime && new Date(product.auctionEndTime) < now;

            if (!isActive || isTimeEnded) {
                // المزاد انتهى
                if (highestBidderId === userId) {
                    status = 'won';
                    message = '🎉 تهانينا! لقد ربحت المنتج.';
                } else {
                    status = 'lost';
                    message = '😞 للأسف، خسرت المزاد.';
                }
            } else {
                // المزاد لا يزال نشطاً
                if (highestBidderId === userId) {
                    status = 'ongoing_leading';
                    message = '⏳ لا يزال في المزاد (أنت المتصدر حالياً).';
                } else {
                    status = 'ongoing_outbid';
                    message = '⚠️ تمت المزايدة عليك بمبلغ أعلى (خسرت مؤقتاً).';
                }
            }

            return {
                product: {
                    _id: product._id,
                    productName: product.productName,
                    description: product.description,
                    category: product.category,
                    imageUrlproduct: product.imageUrlproduct,
                    startingPrice: product.startingPrice,
                    fixedPrice: product.fixedPrice,
                    auctionEndTime: product.auctionEndTime,
                    status: product.status,
                    seller: product.sellerId
                },
                myHighestBid: myHighestBid,
                currentHighestBid: highestAmount,
                currentHighestBidderId: highestBidderId,
                status: status,
                message: message
            };
        });
console.log(result);
        // إرجاع النتيجة
        res.json({
            success: true,
            count: result.length,
            products: result
        });

    } catch (err) {
        console.error("❌ Error fetching my bids with status:", err);
        res.status(500).json({ error: err.message });
    }
};

/**
 /**
 * جلب المنتجات التي اشتراها العميل مع معلومات الدفع
 */
exports.getMyPurchases = async (req, res) => {
    try {
        const userId = req.user.id;

        // جلب الطلبات التي يكون فيها المستخدم هو صاحب العرض الفائز
        const orders = await Order.find({})
            .populate({
                path: 'bidId',
                match: { userId: userId }
            })
            .populate({
                path: 'productId',
                select: 'productName category imageUrlproduct fixedPrice startingPrice status'
                // ❌ تم إزالة populate sellerId لأننا لا نريد عرض البائع
            })
            .populate('deliveryId', 'username email phone')
            .sort({ createdAt: -1 });

        // تصفية الطلبات التي لها bidId (أي المستخدم هو المشتري)
        const filteredOrders = orders.filter(order => order.bidId !== null);

        // تنسيق البيانات مع إضافة معلومات الدفع
        const purchases = filteredOrders.map(order => ({
            orderId: order._id,
            product: order.productId,
            delivery: order.deliveryId,
            bid: order.bidId,
            amount: order.bidId?.bidAmount || 0,
            deliveryStatus: order.deliveryStatus || 'pending',
            // ✅ حقول الدفع (ستؤخذ من قاعدة البيانات إذا وُجدت، وإلا تستخدم القيم الافتراضية)
            paymentMethod: order.paymentMethod || 'cod',
            paymentStatus: order.paymentStatus || 'pending',
            date: order.createdAt || order._id.getTimestamp(),
        }));

        res.json({
            success: true,
            count: purchases.length,
            purchases
        });
    } catch (err) {
        console.error("❌ Error fetching my purchases:", err);
        res.status(500).json({ error: err.message });
    }
};