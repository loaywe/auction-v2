const { User, Product, Bid, Report, Order, Ad } = require("../models/arts.js");
const userController = require("./userController");

// =============================================
// ✅ دالة التحقق من الصلاحيات (للملف الشخصي)
// =============================================
const ensureOwnerOrAdmin = (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: 'غير مصرح' });
        return false;
    }

    // المشرف أو نفس المستخدم (باستخدام username)
    if (req.user.userType !== 'admin' && req.user.username !== req.params.username) {
        res.status(403).json({ error: 'ليس لديك الصلاحيات المطلوبة' });
        return false;
    }

    return true;
};

// =============================================
// ✅ دوال الملف الشخصي (موجودة)
// =============================================
exports.registerMerchant = async (req, res) => {
    req.body.userType = "merchant";
    return userController.createUser(req, res);
};

exports.loginMerchant = async (req, res) => {
    return userController.loginUser(req, res);
};

exports.getMerchantProfile = async (req, res) => {
    if (!ensureOwnerOrAdmin(req, res)) return;
    return userController.getUserByUsername(req, res);
};

exports.updateMerchantProfile = async (req, res) => {
    if (!ensureOwnerOrAdmin(req, res)) return;
    return userController.updateUser(req, res);
};

// =============================================
// ✅ دوال إدارة المنتجات (جلب، إضافة، تعديل، حذف)
// =============================================

/**
 * جلب جميع منتجات التاجر الحالي
 */
exports.getMerchantProducts = async (req, res) => {




    try {
        const products = await Product.find({ sellerId: req.user.id })
            .populate("sellerId", "username email phone");

        res.json({ products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * إضافة منتج جديد (يتم تعيين sellerId تلقائياً من التوكن)
 */
exports.createMerchantProduct = async (req, res) => {
    try {
        const {
            productName,
            description,
            category,
            condition,
            startingPrice,
            fixedPrice,
            auctionEndTime,
            status,
            rating,
            quantity,
        } = req.body;

        // ✅ التحقق: هل المنتج بسعر ثابت أم مزاد؟
        const isFixedPrice = fixedPrice && parseFloat(fixedPrice) > 0;

        let productData = {
            sellerId: req.user.id, // ✅ التاجر الحالي
            productName,
            description,
            category,
            condition,
            startingPrice: Number(startingPrice),
            fixedPrice: isFixedPrice ? Number(fixedPrice) : undefined,
            status: isFixedPrice ? 'sold' : (status || 'active'),
            rating: rating ? Number(rating) : undefined,
            quantity: isFixedPrice ? 1 : (quantity ? Number(quantity) : 1),
            imageUrlproduct: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrlproduct,
        };

        // ✅ إضافة auctionEndTime فقط للمنتجات التي ليست بسعر ثابت
        if (!isFixedPrice) {
            if (!auctionEndTime) {
                return res.status(400).json({
                    success: false,
                    error: 'auctionEndTime is required for auction products'
                });
            }
            productData.auctionEndTime = auctionEndTime;
        }

        const product = new Product(productData);
        await product.save();

        res.status(201).json({
            success: true,
            message: isFixedPrice ? '✅ تم إضافة المنتج (سعر ثابت)' : '✅ تم إضافة المنتج (مزاد)',
            product
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

/**
 * تعديل منتج (مع تحقق الملكية)
 */
exports.updateMerchantProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "المنتج غير موجود" });
        }

        // ✅ التحقق من الملكية
        if (product.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "ليس لديك صلاحية تعديل هذا المنتج" });
        }

        const updateData = { ...req.body };

        // ✅ معالجة الصورة
        if (req.file) {
            updateData.imageUrlproduct = `/uploads/${req.file.filename}`;
        }

        // ✅ تحويل القيم الرقمية
        if (updateData.startingPrice !== undefined) updateData.startingPrice = Number(updateData.startingPrice);
        if (updateData.rating !== undefined) updateData.rating = Number(updateData.rating);
        if (updateData.quantity !== undefined) updateData.quantity = Number(updateData.quantity);

        // ✅ منطق السعر الثابت والمزاد (نفس createAdminProduct)
        const isFixedPrice = updateData.fixedPrice && parseFloat(updateData.fixedPrice) > 0;

        if (isFixedPrice) {
            updateData.status = 'sold';
            updateData.quantity = 1;
            updateData.auctionEndTime = undefined;
        } else {
            if (!updateData.auctionEndTime) {
                return res.status(400).json({
                    success: false,
                    error: 'auctionEndTime is required for auction products'
                });
            }
            if (!updateData.status || updateData.status === 'sold') {
                updateData.status = 'active';
            }
        }

        // ✅ منع تغيير نوع المنتج
        const currentIsFixed = product.fixedPrice && product.fixedPrice > 0;
        const newIsFixed = updateData.fixedPrice && updateData.fixedPrice > 0;
        if (currentIsFixed !== newIsFixed) {
            return res.status(400).json({
                success: false,
                error: '❌ لا يمكن تغيير نوع المنتج (من مزاد إلى سعر ثابت أو العكس)'
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: isFixedPrice ? '✅ تم تحديث المنتج (سعر ثابت)' : '✅ تم تحديث المنتج (مزاد)',
            product: updatedProduct
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

/**
 * حذف منتج (مع تحقق الملكية)
 */
exports.deleteMerchantProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "المنتج غير موجود" });
        }

        // ✅ التحقق من الملكية
        if (product.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "ليس لديك صلاحية حذف هذا المنتج" });
        }

        // ✅ (اختياري) التحقق من وجود مزايدات مرتبطة
        const bids = await Bid.find({ ProductId: product._id });
        if (bids.length > 0) {
            return res.status(400).json({
                error: "لا يمكن حذف المنتج لأنه يحتوي على مزايدات. قم بحذف المزايدات أولاً."
            });
        }

        await product.deleteOne();
        res.json({ message: "✅ تم حذف المنتج بنجاح" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
// ✅ متابعة المزايدات على منتجات التاجر
// =============================================
exports.getMerchantBids = async (req, res) => {
    try {
        console.log("✅ getMerchantBids called!");
        console.log("🔍 req.user:", req.user);
        
        const products = await Product.find({ sellerId: req.user.id }).select('_id');
        console.log("📦 Products found:", products.length);
        
        const productIds = products.map(p => p._id);
        const bids = await Bid.find({ ProductId: { $in: productIds } })
            .populate("ProductId", "productName category imageUrlproduct")
            .populate("userId", "username email phone");

        console.log("💰 Bids found:", bids);
        res.json({ bids });
    } catch (err) {
        console.error("❌ Error in getMerchantBids:", err);
        res.status(500).json({ error: err.message });
    }
};

// =============================================
// ✅ تقارير المبيعات (الطلبات على منتجات التاجر)
// =============================================
exports.getMerchantOrders = async (req, res) => {
    try {
        // 1. جلب معرفات منتجات التاجر
        const products = await Product.find({ sellerId: req.user.id }).select('_id');
        const productIds = products.map(p => p._id);

        // 2. جلب الطلبات الخاصة بهذه المنتجات
        const orders = await Order.find({ productId: { $in: productIds } })
            .populate("productId", "productName category imageUrlproduct")
            .populate("bidId", "bidAmount bidType")
            .populate("deliveryId", "username email phone");

        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};