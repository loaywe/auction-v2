const userController = require("./userController");
const { Order, Report } = require("../models/arts.js"); // ✅ استيراد النماذج المطلوبة

// =============================================
// ✅ دوال الملف الشخصي (موجودة)
// =============================================

const ensureOwnerOrAdmin = (req, res) => {

    if (!req.user) {
        res.status(401).json({ error: 'غير مصرح' });
        return false;
    }

    if (req.user.userType !== 'delivery' && req.user.username !== req.params.username) {

        res.status(403).json({ error: 'ليس لديك الصلاحيات المطلوبة' });
        
        return false;
    }

    return true;
};

exports.registerDelivery = async (req, res) => {
    req.body.userType = "delivery";
    return userController.createUser(req, res);
};

exports.loginDelivery = async (req, res) => {
    return userController.loginUser(req, res);
};

exports.getDeliveryProfile = async (req, res) => {
    if (!ensureOwnerOrAdmin(req, res)) return;
    return userController.getUserByUsername(req, res);
};

exports.updateDeliveryProfile = async (req, res) => {
    if (!ensureOwnerOrAdmin(req, res)) return;
    return userController.updateUser(req, res);
};

// =============================================
// ✅ ✅ ✅ دوال جديدة لإدارة الطلبات
// =============================================

/**
 * جلب جميع الطلبات الموكلة لهذا المندوب
 *//**
 * جلب جميع الطلبات الموكلة لهذا المندوب
 */
exports.getMyDeliveryOrders = async (req, res) => {
    try {
        const deliveryId = req.user.id;

        // جلب الطلبات مع populate متداخل
        const orders = await Order.find({ deliveryId })
            .populate({
                path: 'productId',
                select: 'productName category imageUrlproduct fixedPrice startingPrice',
                populate: {
                    path: 'sellerId',
                    select: 'username email phone'
                }
            })
            .populate({
                path: 'bidId',
                select: 'bidAmount bidType',
                populate: {
                    path: 'userId',
                    select: 'username email phone address'
                }
            })
            .populate('deliveryId', 'username email phone')
            .sort({ createdAt: -1 });

        // تنسيق البيانات لإرجاعها بشكل متوافق مع الواجهة الأمامية
        const formattedOrders = orders.map(order => ({
            _id: order._id,
            productId: order.productId,
            buyerId: order.bidId?.userId || null,   // ✅ المشتري من bidId
            sellerId: order.productId?.sellerId || null, // ✅ البائع من productId
            deliveryId: order.deliveryId,
            bidId: order.bidId,
            amount: order.bidId?.bidAmount || 0,
            deliveryStatus: order.deliveryStatus,
            createdAt: order.createdAt
        }));

        res.status(200).json({
            success: true,
            count: formattedOrders.length,
            orders: formattedOrders
        });
    } catch (err) {
        console.error('❌ خطأ في جلب طلبات المندوب:', err);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب الطلبات',
            error: err.message
        });
    }
};
/**
 * تأكيد توصيل الطلب (تحديث الحالة إلى delivered)
 */
exports.confirmDelivery = async (req, res) => {
    try {
        const { orderId } = req.params;
        const deliveryId = req.user.id;
console.log(deliveryId);

        // 1. البحث عن الطلب
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        // 2. التأكد أن هذا المندوب هو الموكَّل لهذا الطلب
        if (order.deliveryId.toString() !== deliveryId) {
            return res.status(403).json({
                success: false,
                message: 'هذا الطلب ليس موكلاً إليك'
            });
        }

        // 3. التحقق من أنه لم يتم توصيله مسبقاً
        if (order.deliveryStatus === 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'تم تأكيد توصيل هذا الطلب مسبقاً'
            });
        }

        // 4. تحديث حالة التوصيل
        order.deliveryStatus = 'delivered';
        await order.save();

        // 5. (اختياري) تحديث التقرير المرتبط بنفس المزايدة
        if (order.bidId) {
            await Report.findOneAndUpdate(
                { bidId: order.bidId },
                { deliveryStatus: 'delivered' }
            );
        }

        res.status(200).json({
            success: true,
            message: '✅ تم تأكيد التوصيل بنجاح',
            order
        });
    } catch (err) {
        console.error('❌ خطأ في تأكيد التوصيل:', err);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تأكيد التوصيل',
            error: err.message
        });
    }
};