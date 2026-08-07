const { User, Product, Bid, Report, Order, Ad } = require("../models/arts.js");
const userController = require("./userController");

const ensureAdmin = (req, res) => {
    if (!req.user || req.user.userType !== "admin") {
        res.status(403).json({ error: "ليس لديك الصلاحيات المطلوبة" });
        return false;
    }
    return true;
};

// جلب جميع المستخدمين
exports.getAdminUsers = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// جلب جميع المنتجات
exports.getAdminProducts = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const products = await Product.find()
            .populate("sellerId", "username email phone");

        res.json({ products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// جلب جميع المزايدات
exports.getAdminBids = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const bids = await Bid.find()
            .populate("ProductId", "productName category imageUrlproduct")
            .populate("userId", "username email");

        res.json({ bids });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// جلب التقارير / الطلبات الجاهزة
exports.getAdminReports = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const reports = await Report.find()
            .populate("productId", "productName category imageUrlproduct")
            .populate("sellerId", "username email phone")
            .populate("buyerId", "username email phone")
            .populate("deliveryId", "username email phone");

        res.json({ reports });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAdminReportById = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const report = await Report.findById(req.params.id)
            .populate("productId", "productName category imageUrlproduct")
            .populate("sellerId", "username email phone")
            .populate("buyerId", "username email phone")
            .populate("deliveryId", "username email phone");
        if (!report) {
            return res.status(404).json({ error: "التقرير غير موجود" });
        }
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createAdminReport = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const { productId, bidId, sellerId, buyerId, deliveryId, deliveryStatus, bidType, paid } = req.body;
        const report = new Report({
            productId,
            bidId,
            sellerId,
            buyerId,
            deliveryId,
            deliveryStatus,
            bidType,
            paid: paid === 'true' || paid === true,
        });
        await report.save();
        res.status(201).json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAdminReport = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const updateData = { ...req.body };
        if (updateData.paid !== undefined) {
            updateData.paid = updateData.paid === 'true' || updateData.paid === true;
        }
        const report = await Report.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!report) {
            return res.status(404).json({ error: "التقرير غير موجود" });
        }
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAdminReport = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const report = await Report.findByIdAndDelete(req.params.id);
        if (!report) {
            return res.status(404).json({ error: "التقرير غير موجود" });
        }
        res.json({ message: "تم حذف التقرير" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// جلب منتج واحد
exports.getAdminProductById = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const { id } = req.params;
        
        // ✅ التحقق من وجود ID
        if (!id) {
            return res.status(400).json({ 
                success: false,
                error: "❌ معرف المنتج مطلوب" 
            });
        }

        // ✅ التحقق من صحة الـ ObjectId
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: "❌ معرف المنتج غير صحيح" 
            });
        }

        const product = await Product.findById(id).populate("sellerId", "username email phone");
        
        if (!product) {
            return res.status(404).json({ 
                success: false,
                error: "❌ المنتج غير موجود" 
            });
        }
        
        res.json(product);
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};



exports.createAdminProduct = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const {
            sellerId,
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
        const isFixedPrice = fixedPrice && fixedPrice > 0;

        // ✅ إذا كان سعر ثابت، تجاهل auctionEndTime تماماً
        let productData = {
            sellerId,
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

        // ✅ إضافة auctionEndTime فقط للمنتجات التي ليست بسعر ثابت (منتجات المزاد)
        if (!isFixedPrice) {
            // التأكد من وجود وقت انتهاء للمزاد
            if (!auctionEndTime) {
                return res.status(400).json({
                    success: false,
                    error: 'auctionEndTime is required for auction products'
                });
            }
            productData.auctionEndTime = auctionEndTime;
        }
        // ✅ منتجات السعر الثابت لا تحتوي على auctionEndTime في البيانات

        // إنشاء المنتج
        const product = new Product(productData);
        await product.save();

        // ✅ رسالة توضيحية
        const message = isFixedPrice
            ? '✅ Product created as FIXED PRICE and marked as SOLD (not for auction)'
            : '✅ Product created for AUCTION';

        res.status(201).json({
            success: true,
            message: message,
            productType: isFixedPrice ? 'Fixed Price' : 'Auction',
            product: {
                ...product.toObject(),
                // إظهار حقول واضحة
                isFixedPrice: isFixedPrice,
                isAuction: !isFixedPrice,
                hasAuctionEndTime: !!productData.auctionEndTime
            }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.updateAdminProduct = async (req, res) => {
    if (!ensureAdmin(req, res)) return;
console.log("📥 Update request received for product ID:", req.params.id)   ;
    try {
        const updateData = { ...req.body };
console.log("Update Data Received:");
        // ✅ معالجة الصورة
        if (req.file) {
            updateData.imageUrlproduct = `/uploads/${req.file.filename}`;
        }

        // ✅ تحويل القيم الرقمية
        if (updateData.startingPrice !== undefined) updateData.startingPrice = Number(updateData.startingPrice);
        if (updateData.rating !== undefined) updateData.rating = Number(updateData.rating);
        if (updateData.quantity !== undefined) updateData.quantity = Number(updateData.quantity);

        // ✅ منطق ذكي للسعر الثابت والمزاد (مثل createAdminProduct)
        const isFixedPrice = updateData.fixedPrice && parseFloat(updateData.fixedPrice) > 0;

        if (isFixedPrice) {
            // ✅ منتج بسعر ثابت
            updateData.status = 'sold';
            updateData.quantity = 1;
            // ✅ إزالة auctionEndTime إن وجد
            updateData.auctionEndTime = undefined;
        } else {
            // ✅ منتج مزاد
            // التأكد من وجود auctionEndTime
            if (!updateData.auctionEndTime) {
                return res.status(400).json({
                    success: false,
                    error: 'auctionEndTime is required for auction products'
                });
            }
            // ✅ إذا كان status غير محدد، اجعله active
            if (!updateData.status || updateData.status === 'sold') {
                updateData.status = 'active';
            }
        }

        // ✅ جلب المنتج الحالي للتحقق من وجوده
        const currentProduct = await Product.findById(req.params.id);
        if (!currentProduct) {
            return res.status(404).json({ error: "المنتج غير موجود" });
        }

        // ✅ منع تغيير نوع المنتج (تحقق أمان إضافي)
        const currentIsFixed = currentProduct.fixedPrice && currentProduct.fixedPrice > 0;
        const newIsFixed = updateData.fixedPrice && updateData.fixedPrice > 0;
        
        if (currentIsFixed !== newIsFixed) {
            return res.status(400).json({
                success: false,
                error: '❌ لا يمكن تغيير نوع المنتج (من مزاد إلى سعر ثابت أو العكس)'
            });
        }

        // ✅ تحديث المنتج
        const product = await Product.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: isFixedPrice ? '✅ تم تحديث المنتج (سعر ثابت)' : '✅ تم تحديث المنتج (مزاد)',
            productType: isFixedPrice ? 'Fixed Price' : 'Auction',
            product
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.deleteAdminProduct = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "المنتج غير موجود" });
        }
        res.json({ message: "تم حذف المنتج" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// جلب مزايدة واحدة
exports.getAdminBidById = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const bid = await Bid.findById(req.params.id)
            .populate("ProductId", "productName category imageUrlproduct")
            .populate("userId", "username email");
        if (!bid) {
            return res.status(404).json({ error: "المزايدة غير موجودة" });
        }
        res.json(bid);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createAdminBid = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const { ProductId, userId, bidAmount, bidType } = req.body;
        const bid = new Bid({ ProductId, userId, bidAmount: Number(bidAmount), bidType });
        await bid.save();
        res.status(201).json(bid);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAdminBid = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const updateData = { ...req.body };
        if (updateData.bidAmount !== undefined) updateData.bidAmount = Number(updateData.bidAmount);

        const bid = await Bid.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!bid) {
            return res.status(404).json({ error: "المزايدة غير موجودة" });
        }
        res.json(bid);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAdminBid = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const bid = await Bid.findByIdAndDelete(req.params.id);
        if (!bid) {
            return res.status(404).json({ error: "المزايدة غير موجودة" });
        }
        res.json({ message: "تم حذف المزايدة" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// جلب أوامر
exports.getAdminOrders = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const orders = await Order.find()
            .populate("productId", "productName category imageUrlproduct")
            .populate("bidId", "bidAmount bidType")
            .populate("deliveryId", "username email phone");
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAdminOrderById = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const order = await Order.findById(req.params.id)
            .populate("productId", "productName category imageUrlproduct")
            .populate("bidId", "bidAmount bidType")
            .populate("deliveryId", "username email phone");
        if (!order) {
            return res.status(404).json({ error: "الأمر غير موجود" });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createAdminOrder = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const { productId, bidId, deliveryId, deliveryStatus } = req.body;
        const order = new Order({ productId, bidId, deliveryId, deliveryStatus });
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAdminOrder = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!order) {
            return res.status(404).json({ error: "الأمر غير موجود" });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAdminOrder = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "الأمر غير موجود" });
        }
        res.json({ message: "تم حذف الأمر" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// إعلانات
exports.getAdminAds = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const ads = await Ad.find().populate("userId", "username email phone");
        res.json({ ads });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAdminAdById = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const ad = await Ad.findById(req.params.id).populate("userId", "username email phone");
        if (!ad) {
            return res.status(404).json({ error: "الإعلان غير موجود" });
        }
        res.json(ad);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createAdminAd = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const { userId, title, description, status } = req.body;
        const ad = new Ad({
            userId,
            title,
            description,
            status,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl,
        });
        await ad.save();
        res.status(201).json(ad);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAdminAd = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const updateData = { ...req.body };
        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const ad = await Ad.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!ad) {
            return res.status(404).json({ error: "الإعلان غير موجود" });
        }
        res.json(ad);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAdminAd = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const ad = await Ad.findByIdAndDelete(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: "الإعلان غير موجود" });
        }
        res.json({ message: "تم حذف الإعلان" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// جلب مستخدم حسب الاسم
exports.getAdminUserByUsername = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const user = await User.findOne({ username: req.params.username }).select("-password");

        if (!user) {
            return res.status(404).json({
                error: "المستخدم غير موجود"
            });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// إنشاء مستخدم
exports.createAdminUser = async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    return userController.createUser(req, res);
};

// تعديل مستخدم
exports.updateAdminUser = async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    return userController.updateUser(req, res);
};

// حذف مستخدم
exports.deleteAdminUser = async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    return userController.deleteUser(req, res);
};