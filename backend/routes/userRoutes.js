const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { auth } = require("../middleware/auth");

// ✅ استيراد جميع الدوال من userController
const {
    getUsers,
    getUserByUsername,
    createUser,
    updateUser,
    deleteUser,
    loginUser,
    // ✅ دوال المزاد
    getActiveAuctionProducts,
    getAllAuctionProductsWithStatus,
    checkAndProcessExpiredAuctions,
    getAvailableForBidding,
    getProductBiddingDetails,
    // ✅ دوال المنتجات ذات السعر الثابت
    getFixedPriceProducts,
    getFixedPriceProductDetails,
    addFixedPriceProduct,
    updateFixedPriceProduct,
    deleteFixedPriceProduct,
    getProductsByType,
    getSalesReports,
    getProductById,
    createCODPurchase,
    // ✅ ✅ ✅ الدالة الجديدة
    getProductsByStatus
} = require("../controllers/userController");

// =============================================
// ✅ Routes الخاصة بالمستخدمين
// =============================================
router.post("/purchase/cod", auth, createCODPurchase);

router.get("/", getUsers);
router.post("/login", loginUser);
router.get("/:username", getUserByUsername);
router.post("/", upload.single("idImage"), createUser);
router.patch("/:username", upload.single("idImage"), updateUser);
router.delete("/:username", deleteUser);
router.get("/products/:productId", getProductById);


// ✅ جلب بيانات المستخدم الحالي من التوكن
router.get("/me", auth, async (req, res) => {
    try {
        const User = require("../models/arts.js").User;
        
        const user = await User.findOne({ username: req.user.username }).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        res.json(user);
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({ error: 'حدث خطأ في جلب البيانات' });
    }
});

// =============================================
// ✅ مسارات المنتجات حسب النوع (مشتركة)
// =============================================

// جلب المنتجات حسب النوع (auction أو fixed)
router.get("/products/type/:type", getProductsByType);

// ✅ ✅ ✅ المسار الصحيح: جلب المنتجات حسب الحالة (من body)
router.post("/products/status", getProductsByStatus);

// =============================================
// ✅ مسارات المزاد (عامة - لا تحتاج مصادقة)
// =============================================

// جلب المنتجات النشطة في المزاد
router.get("/auction/active", getActiveAuctionProducts);

// جلب جميع منتجات المزاد مع حالتها
router.get("/auction/all", getAllAuctionProductsWithStatus);

// جلب المنتجات المتاحة للمزايدة مع فلترة
router.get("/auction/available", getAvailableForBidding);

// جلب تفاصيل منتج معين في المزاد
router.get("/auction/:productId/details", getProductBiddingDetails);

// =============================================
// ✅ مسارات المنتجات ذات السعر الثابت
// =============================================

// جلب جميع المنتجات ذات السعر الثابت (نشطة فقط)
router.get("/products/fixed", getFixedPriceProducts);

// جلب تفاصيل منتج بسعر ثابت
router.get("/products/fixed/:productId", getFixedPriceProductDetails);

// إضافة منتج بسعر ثابت (للبائعين والمشرفين فقط)
router.post("/products/fixed", auth, async (req, res, next) => {
    if (req.user.userType !== 'merchant' && req.user.userType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'ليس لديك صلاحية لإضافة منتجات'
        });
    }
    next();
}, addFixedPriceProduct);

// تحديث منتج بسعر ثابت
router.put("/products/fixed/:productId", auth, updateFixedPriceProduct);

// حذف منتج بسعر ثابت
router.delete("/products/fixed/:productId", auth, deleteFixedPriceProduct);

// =============================================
// ✅ مسارات إضافية للمزاد
// =============================================

// جلب المنتجات حسب الفئة (للمزاد)
router.get("/auction/category/:category", async (req, res) => {
    try {
        const { category } = req.params;
        const now = new Date();
        const Product = require("../models/arts.js").Product;
        
        const products = await Product.find({
            $or: [
                { fixedPrice: { $exists: false } },
                { fixedPrice: null },
                { fixedPrice: 0 }
            ],
            category: category,
            auctionEndTime: { $gt: now },
            status: 'active'
        }).populate('sellerId', 'username email phone');
        
        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المنتجات حسب الفئة',
            error: error.message
        });
    }
});

// جلب المنتجات حسب الفئة (للسعر الثابت)
router.get("/products/fixed/category/:category", async (req, res) => {
    try {
        const { category } = req.params;
        const Product = require("../models/arts.js").Product;
        
        const products = await Product.find({
            fixedPrice: { $exists: true, $ne: null, $gt: 0 },
            category: category,
            status: 'active'
        }).populate('sellerId', 'username email phone');
        
        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المنتجات حسب الفئة',
            error: error.message
        });
    }
});

// =============================================
// ✅ مسارات المزاد (تتطلب مصادقة)
// =============================================

// معالجة المزادات المنتهية (للمشرفين فقط)
router.post("/auction/process-expired", auth, async (req, res, next) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'ليس لديك صلاحية للقيام بهذه العملية' 
        });
    }
    next();
}, checkAndProcessExpiredAuctions);

// جلب مزايدات المستخدم الحالي
router.get("/my-bids", auth, async (req, res) => {
    try {
        const Bid = require("../models/arts.js").Bid;
        const bids = await Bid.find({ userId: req.user.id })
            .populate({
                path: 'ProductId',
                select: 'productName imageUrlproduct startingPrice fixedPrice auctionEndTime status'
            })
            .sort({ bidTime: -1 });
        
        res.status(200).json({
            success: true,
            count: bids.length,
            bids: bids.map(bid => ({
                ...bid.toObject(),
                isAuction: bid.bidType === 'auction',
                productPrice: bid.ProductId?.fixedPrice || bid.ProductId?.startingPrice || 0
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المزايدات',
            error: error.message
        });
    }
});

// جلب المنتجات التي فاز بها المستخدم
router.get("/my-won-auctions", auth, async (req, res) => {
    try {
        const Report = require("../models/arts.js").Report;
        const reports = await Report.find({ 
            buyerId: req.user.id
        }).populate({
            path: 'productId',
            select: 'productName imageUrlproduct startingPrice fixedPrice description'
        }).populate('sellerId', 'username email phone')
        .populate('deliveryId', 'username email phone')
        .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: reports.length,
            wonAuctions: reports.map(report => ({
                ...report.toObject(),
                isAuction: report.bidType === 'auction',
                productPrice: report.productId?.fixedPrice || report.productId?.startingPrice || 0
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المزادات الفائزة',
            error: error.message
        });
    }
});

// إضافة مزايدة جديدة على منتج (للمزاد فقط)
router.post("/auction/:productId/bid", auth, async (req, res) => {
    try {
        const { productId } = req.params;
        const { bidAmount } = req.body;
        
        const Product = require("../models/arts.js").Product;
        const Bid = require("../models/arts.js").Bid;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }
        
        // التحقق من أن المنتج متاح للمزايدة
        if (product.fixedPrice && product.fixedPrice > 0) {
            return res.status(400).json({
                success: false,
                message: 'هذا المنتج ليس للبيع بالمزاد'
            });
        }
        
        const now = new Date();
        if (product.auctionEndTime <= now) {
            return res.status(400).json({
                success: false,
                message: 'انتهت مدة المزاد على هذا المنتج'
            });
        }
        
        if (product.sellerId.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكنك المزايدة على منتجك الخاص'
            });
        }
        
        const highestBid = await Bid.findOne({ ProductId: productId })
            .sort({ bidAmount: -1 });
        
        const minBid = highestBid ? highestBid.bidAmount + 1 : product.startingPrice;
        
        if (bidAmount < minBid) {
            return res.status(400).json({
                success: false,
                message: `يجب أن تكون المزايدة على الأقل ${minBid}`
            });
        }
        
        const newBid = new Bid({
            ProductId: productId,
            userId: req.user.id,
            bidAmount: bidAmount,
            bidType: 'auction'
        });
        
        await newBid.save();
        
        res.status(201).json({
            success: true,
            message: 'تم إضافة المزايدة بنجاح',
            bid: newBid
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء إضافة المزايدة',
            error: error.message
        });
    }
});

// =============================================
// ✅ مسارات التقارير (للمشرفين فقط)
// =============================================

// جلب تقارير المبيعات
router.get("/reports/sales", auth, async (req, res, next) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'ليس لديك صلاحية لعرض التقارير'
        });
    }
    next();
}, getSalesReports);

// =============================================
// ✅ مسارات إضافية للمستخدمين
// =============================================

// جلب المنتجات التي اشتراها المستخدم (سعر ثابت)
router.get("/my-purchases", auth, async (req, res) => {
    try {
        const Report = require("../models/arts.js").Report;
        const purchases = await Report.find({ 
            buyerId: req.user.id,
            bidType: 'fixed'
        }).populate({
            path: 'productId',
            select: 'productName imageUrlproduct fixedPrice description'
        }).populate('sellerId', 'username email phone')
        .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: purchases.length,
            purchases
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المشتريات',
            error: error.message
        });
    }
});

// جلب منتجات البائع (للبائعين)
router.get("/my-products", auth, async (req, res) => {
    try {
        const Product = require("../models/arts.js").Product;
        
        const products = await Product.find({ 
            sellerId: req.user.id
        }).sort({ creationDate: -1 });
        
        res.status(200).json({
            success: true,
            count: products.length,
            products: products.map(p => ({
                ...p.toObject(),
                isAuction: !p.fixedPrice || p.fixedPrice === 0
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب منتجاتك',
            error: error.message
        });
    }
});



// =============================================
// ✅ مسارات Google Authentication
// =============================================

// ✅ استيراد دوال Google من userController
const {
    setupGoogleStrategy,
    googleAuth,
    googleAuthCallback,
    getGoogleUser,
    googleLogout,
    googleLoginAPI
} = require("../controllers/userController");

// ✅ تهيئة استراتيجية Google (مرة واحدة)
setupGoogleStrategy();

// ✅ مسار بدء تسجيل الدخول عبر Google
router.get("/auth/google", googleAuth);

// ✅ مسار إعادة التوجيه بعد تسجيل الدخول
router.get("/auth/google/callback", googleAuthCallback);

// ✅ جلب مستخدم Google الحالي (API)
router.get("/auth/google/user", auth, getGoogleUser);

// ✅ تسجيل الخروج من Google
router.get("/auth/logout", googleLogout);

// ✅ تسجيل الدخول عبر Google وإرجاع Token (API)
router.post("/auth/google/token", googleLoginAPI);

module.exports = router;