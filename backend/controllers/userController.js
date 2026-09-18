const { User, Product, Bid, Report, Order, Comment } = require("../models/arts.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require('mongoose');

// =============================================
// ✅ دوال المستخدم الأصليه
// =============================================

// جلب جميع المستخدمين
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// جلب مستخدم حسب الاسم
exports.getUserByUsername = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select("-password");
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// إضافة مستخدم جديد
exports.createUser = async (req, res) => {
    try {
        const { username, password, email, phone, address, userType, gender, age } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم وكلمة المرور والبريد الإلكتروني' });
        }

        const existingUser = await User.findOne({
            $or: [{ username }, { email }],
        });
        if (existingUser) {
            return res.status(400).json({ error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            username,
            password: hashedPassword,
            email,
            phone,
            address,
            userType: userType || 'customer',
            gender,
            age: age ? Number(age) : undefined,
            idImage: req.file ? `/uploads/${req.file.filename}` : undefined,
        });

        await newUser.save();
        const userObj = newUser.toObject();
        delete userObj.password;
        res.status(201).json(userObj);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
        }
        res.status(500).json({ error: err.message });
    }
};

// تعديل مستخدم
exports.updateUser = async (req, res) => {
    try {
        const { username } = req.params;
        const updateData = { ...req.body };

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        if (updateData.userType && updateData.userType !== user.userType) {
            if (!req.user || req.user.userType !== 'admin') {
                return res.status(403).json({ error: 'ليس لديك الصلاحيات لتغيير نوع المستخدم' });
            }
        }

        if (updateData.username && updateData.username !== username) {
            const exists = await User.findOne({ username: updateData.username, _id: { $ne: user._id } });
            if (exists) {
                return res.status(400).json({ error: 'اسم المستخدم مستخدم بالفعل' });
            }
        }

        if (updateData.email && updateData.email !== user.email) {
            const exists = await User.findOne({ email: updateData.email, _id: { $ne: user._id } });
            if (exists) {
                return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
            }
        }

        if (req.file) {
            updateData.idImage = `/uploads/${req.file.filename}`;
        }

        if (updateData.age) {
            updateData.age = Number(updateData.age);
        }

        const allowedFields = [
            'username',
            'email',
            'phone',
            'address',
            'userType',
            'gender',
            'age',
            'isVerified',
            'password',
            'idImage',
        ];
        Object.keys(updateData).forEach((key) => {
            if (!allowedFields.includes(key)) {
                delete updateData[key];
            }
        });

        const updatedUser = await User.findOneAndUpdate({ username }, updateData, { new: true }).select("-password");
        res.json(updatedUser);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
        }
        res.status(500).json({ error: err.message });
    }
};

// حذف مستخدم
exports.deleteUser = async (req, res) => {
    try {
        const { username } = req.params;



        const user = await User.findOneAndDelete({_id: username });
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        res.json({ message: 'تم حذف المستخدم بنجاح' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// تسجيل الدخول
exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
        }

        const user = await User.findOne({ username });
        const passwordMatches = user && await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                userType: user.userType,
            },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '12h' }
        );

        const userObj = user.toObject();
        delete userObj.password;
        res.json({ user: userObj, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
// ✅ دوال المزاد
// =============================================

/**
 * جلب جميع المنتجات النشطة في المزاد (لم تنتهي)
 */
exports.getActiveAuctionProducts = async (req, res) => {
    try {
        const now = new Date();
        
        const activeProducts = await Product.find({
            $or: [
                { fixedPrice: { $exists: false } },
                { fixedPrice: null },
                { fixedPrice: 0 }
            ],
            auctionEndTime: { $gt: now },
            status: 'active'
        }).populate('sellerId', 'username email phone');

        res.status(200).json({
            success: true,
            count: activeProducts.length,
            products: activeProducts
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المنتجات النشطة',
            error: err.message
        });
    }
};

/**
 * جلب جميع المنتجات (نشطة ومنتهية) مع حالة كل منها
 */
exports.getAllAuctionProductsWithStatus = async (req, res) => {
    try {
        const now = new Date();
        
        const products = await Product.find({
            $or: [
                { fixedPrice: { $exists: false } },
                { fixedPrice: null },
                { fixedPrice: 0 }
            ]
        }).populate('sellerId', 'username email phone');

        const activeProducts = [];
        const expiredProducts = [];

        products.forEach(product => {
            if (product.auctionEndTime > now && product.status === 'active') {
                activeProducts.push(product);
            } else {
                expiredProducts.push(product);
            }
        });

        res.status(200).json({
            success: true,
            active: {
                count: activeProducts.length,
                products: activeProducts
            },
            expired: {
                count: expiredProducts.length,
                products: expiredProducts
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المنتجات',
            error: err.message
        });
    }
};

/**
 * التحقق من المنتجات المنتهية وتسجيلها لآخر مزايد
 */
exports.checkAndProcessExpiredAuctions = async (req, res) => {
    try {
        const now = new Date();
        const results = {
            processed: [],
            errors: []
        };

        const expiredProducts = await Product.find({
            $or: [
                { fixedPrice: { $exists: false } },
                { fixedPrice: null },
                { fixedPrice: 0 }
            ],
            auctionEndTime: { $lte: now },
            status: 'active'
        });

        if (expiredProducts.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'لا توجد مزادات منتهية للمعالجة',
                processed: []
            });
        }

        for (const product of expiredProducts) {
            try {
                const highestBid = await Bid.findOne({
                    ProductId: product._id
                }).sort({ bidAmount: -1 }).populate('userId', 'username email phone');

                if (highestBid) {
                    product.status = 'sold';
                    await product.save();

                    const report = new Report({
                        productId: product._id,
                        bidId: highestBid._id,
                        sellerId: product.sellerId,
                        buyerId: highestBid.userId._id,
                        bidType: 'auction',
                        paid: false,
                        deliveryStatus: 'pending'
                    });
                    await report.save();

                    results.processed.push({
                        productId: product._id,
                        productName: product.productName,
                        winner: highestBid.userId.username,
                        winningBid: highestBid.bidAmount,
                        status: 'sold'
                    });

                } else {
                    product.status = 'expired';
                    await product.save();
                    
                    results.processed.push({
                        productId: product._id,
                        productName: product.productName,
                        status: 'expired',
                        message: 'لا توجد مزايدات على هذا المنتج'
                    });
                }

            } catch (err) {
                results.errors.push({
                    productId: product._id,
                    productName: product.productName,
                    error: err.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `تم معالجة ${results.processed.length} منتج`,
            results: results
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء معالجة المزادات المنتهية',
            error: err.message
        });
    }
};

/**
 * جلب المنتجات المتاحة للمزايدة فقط (نشطة وغير منتهية)
 */
exports.getAvailableForBidding = async (req, res) => {
    try {
        const now = new Date();
        const { category, minPrice, maxPrice, search } = req.query;

        const filter = {
            $or: [
                { fixedPrice: { $exists: false } },
                { fixedPrice: null },
                { fixedPrice: 0 }
            ],
            auctionEndTime: { $gt: now },
            status: 'active'
        };

        if (category && category !== 'الكل') {
            filter.category = category;
        }

        if (minPrice || maxPrice) {
            filter.startingPrice = {};
            if (minPrice) filter.startingPrice.$gte = Number(minPrice);
            if (maxPrice) filter.startingPrice.$lte = Number(maxPrice);
        }

        if (search) {
            filter.productName = { $regex: search, $options: 'i' };
        }

        const products = await Product.find(filter)
            .populate('sellerId', 'username email phone rating')
            .sort({ auctionEndTime: 1 })
            .select('-__v');

        const productsWithTimeLeft = products.map(product => {
            const timeLeft = product.auctionEndTime - now;
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            return {
                ...product.toObject(),
                timeLeft: {
                    days,
                    hours,
                    minutes,
                    totalSeconds: Math.floor(timeLeft / 1000)
                },
                bidCount: 0
            };
        });

        for (let product of productsWithTimeLeft) {
            const bidCount = await Bid.countDocuments({ ProductId: product._id });
            product.bidCount = bidCount;
            
            const highestBid = await Bid.findOne({ ProductId: product._id })
                .sort({ bidAmount: -1 });
            if (highestBid) {
                product.currentHighestBid = highestBid.bidAmount;
            } else {
                product.currentHighestBid = product.startingPrice;
            }
        }

        res.status(200).json({
            success: true,
            count: productsWithTimeLeft.length,
            products: productsWithTimeLeft
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المنتجات المتاحة للمزايدة',
            error: err.message
        });
    }
};

/**
 * جلب تفاصيل منتج معين للمزايدة مع عرض المزايدات السابقة
 */
exports.getProductBiddingDetails = async (req, res) => {
    try {
        const { productId } = req.params;
        const now = new Date();

        const product = await Product.findById(productId)
            .populate('sellerId', 'username email phone rating');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        if (product.fixedPrice && product.fixedPrice > 0) {
            return res.status(400).json({
                success: false,
                message: 'هذا المنتج ليس للبيع بالمزاد'
            });
        }

        if (product.auctionEndTime <= now || product.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'انتهت مدة المزايدة على هذا المنتج'
            });
        }

        const bids = await Bid.find({ ProductId: productId })
            .populate('userId', 'username')
            .sort({ bidAmount: -1 });

        const highestBid = bids.length > 0 ? bids[0] : null;

        const timeLeft = product.auctionEndTime - now;
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        res.status(200).json({
            success: true,
            product: {
                ...product.toObject(),
                timeLeft: {
                    days,
                    hours,
                    minutes,
                    totalSeconds: Math.floor(timeLeft / 1000)
                },
                currentPrice: highestBid ? highestBid.bidAmount : product.startingPrice,
                totalBids: bids.length,
                bids: bids.map(bid => ({
                    bidder: bid.userId.username,
                    amount: bid.bidAmount,
                    time: bid.bidTime
                }))
            }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب تفاصيل المنتج',
            error: err.message
        });
    }
};

/**
 * وظيفة مجدولة (Cron Job) لمعالجة المزادات المنتهية تلقائياً
 */
exports.autoProcessExpiredAuctions = async () => {
    try {
        const now = new Date();
        console.log(`⏰ [${new Date().toLocaleString('ar-SA')}] بدء معالجة المزادات المنتهية...`);
        
        const expiredProducts = await Product.find({
            $or: [
                { fixedPrice: { $exists: false } },
                { fixedPrice: null },
                { fixedPrice: 0 }
            ],
            auctionEndTime: { $lte: now },
            status: 'active'
        });

        console.log(`📊 عدد المنتجات المنتهية: ${expiredProducts.length}`);

        if (expiredProducts.length === 0) {
            console.log('✅ لا توجد مزادات منتهية للمعالجة');
            return;
        }

        let soldCount = 0;
        let expiredCount = 0;

        for (const product of expiredProducts) {
            const highestBid = await Bid.findOne({
                ProductId: product._id
            }).sort({ bidAmount: -1 }).populate('userId');

            if (highestBid) {
                product.status = 'sold';
                await product.save();

                // Report (موجود مسبقاً)
                const report = new Report({
                    productId: product._id,
                    bidId: highestBid._id,
                    sellerId: product.sellerId,
                    buyerId: highestBid.userId._id,
                    bidType: 'auction',
                    paid: false,
                    deliveryStatus: 'pending'
                });
                await report.save();

                // ✅ ✅ ✅ إنشاء Order مع دفع عبر البطاقة (تمت الإضافة)
                const order = new Order({
                    productId: product._id,
                    bidId: highestBid._id,
                    buyerId: highestBid.userId._id,
                    sellerId: product.sellerId,
                    deliveryId: null,          // سيتم تعيينه لاحقاً
                    amount: highestBid.bidAmount,
                    quantity: 1,
                    status: 'pending',
                    date: new Date(),
                    paymentMethod: 'card',     // 🔴 التعديل هنا
                    paymentStatus: 'pending',  // 🔴 التعديل هنا
                    deliveryStatus: 'pending'
                });
                await order.save();

                soldCount++;
                console.log(`✅ تم بيع المنتج ${product.productName} للمستخدم ${highestBid.userId.username} بمبلغ ${highestBid.bidAmount} ر.س (دفع عبر البطاقة)`);
            } else {
                product.status = 'expired';
                await product.save();
                expiredCount++;
                console.log(`⏰ انتهت مدة المزاد للمنتج ${product.productName} دون مزايدات`);
            }
        }

        console.log(`📊 ملخص المعالجة: تم البيع: ${soldCount}, منتهي: ${expiredCount}`);
        console.log(`✅ [${new Date().toLocaleString('ar-SA')}] انتهت معالجة المزادات المنتهية`);

    } catch (err) {
        console.error('❌ خطأ في معالجة المزادات التلقائية:', err.message);
    }
};

// =============================================
// ✅ دوال المنتجات ذات السعر الثابت
// =============================================

/**
 * جلب جميع المنتجات ذات السعر الثابت (بدون مزاد)
 */
exports.getFixedPriceProducts = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, search, sortBy = 'newest' } = req.query;

        const filter = {
            fixedPrice: { $exists: true, $ne: null, $gt: 0 },
            status: 'active'
        };

        if (category && category !== 'الكل') {
            filter.category = category;
        }

        if (minPrice || maxPrice) {
            filter.fixedPrice = {};
            if (minPrice) filter.fixedPrice.$gte = Number(minPrice);
            if (maxPrice) filter.fixedPrice.$lte = Number(maxPrice);
        }

        if (search) {
            filter.productName = { $regex: search, $options: 'i' };
        }

        let sortOption = { creationDate: -1 };
        if (sortBy === 'price-low') sortOption = { fixedPrice: 1 };
        else if (sortBy === 'price-high') sortOption = { fixedPrice: -1 };
        else if (sortBy === 'newest') sortOption = { creationDate: -1 };
        else if (sortBy === 'oldest') sortOption = { creationDate: 1 };

        const products = await Product.find(filter)
            .populate('sellerId', 'username email phone rating isVerified')
            .sort(sortOption)
            .select('-__v');

        const formattedProducts = products.map(product => ({
            ...product.toObject(),
            isAuction: false,
            inStock: product.quantity > 0,
            isVerified: product.sellerId?.isVerified || false,
            sellerName: product.sellerId?.username || 'بائع',
            reviewCount: 0,
            imageUrl: product.imageUrlproduct
        }));

        res.status(200).json({
            success: true,
            count: formattedProducts.length,
            products: formattedProducts
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المنتجات ذات السعر الثابت',
            error: err.message
        });
    }
};

/**
 * جلب تفاصيل منتج بسعر ثابت
 */
exports.getFixedPriceProductDetails = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId)
            .populate('sellerId', 'username email phone rating isVerified');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        if (!product.fixedPrice || product.fixedPrice === 0) {
            return res.status(400).json({
                success: false,
                message: 'هذا المنتج ليس للبيع بسعر ثابت'
            });
        }

        const comments = await Comment.find({ productId: product._id })
            .populate('userId', 'username')
            .sort({ createAt: -1 });

        let averageRating = product.rating || 0;
        let reviewCount = comments.length || 0;

        if (comments.length > 0) {
            const totalRating = comments.reduce((sum, c) => sum + (c.rating || 0), 0);
            averageRating = totalRating / comments.length;
        }

        res.status(200).json({
            success: true,
            product: {
                ...product.toObject(),
                isAuction: false,
                inStock: product.quantity > 0,
                isVerified: product.sellerId?.isVerified || false,
                sellerName: product.sellerId?.username || 'بائع',
                averageRating: averageRating || product.rating || 0,
                reviewCount: reviewCount,
                comments: comments
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب تفاصيل المنتج',
            error: err.message
        });
    }
};

/**
 * إضافة منتج بسعر ثابت (للبائعين فقط)
 */
exports.addFixedPriceProduct = async (req, res) => {
    try {
        const {
            productName,
            description,
            category,
            condition,
            fixedPrice,
            quantity = 1,
            imageUrlproduct
        } = req.body;

        if (!productName || !fixedPrice || !imageUrlproduct) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء إدخال اسم المنتج والسعر الثابت والصورة'
            });
        }

        const newProduct = new Product({
            sellerId: req.user.id,
            productName,
            description,
            category: category || 'اخرى',
            condition: condition || 'new',
            fixedPrice: Number(fixedPrice),
            quantity: Number(quantity) || 1,
            imageUrlproduct: imageUrlproduct.startsWith('http') ? imageUrlproduct : `/uploads/${imageUrlproduct}`,
            status: 'active',
            creationDate: new Date()
        });

        await newProduct.save();

        res.status(201).json({
            success: true,
            message: 'تم إضافة المنتج بنجاح',
            product: newProduct
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء إضافة المنتج',
            error: err.message
        });
    }
};

/**
 * تحديث منتج بسعر ثابت
 */
exports.updateFixedPriceProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updateData = { ...req.body };

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        if (product.sellerId.toString() !== req.user.id && req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية لتعديل هذا المنتج'
            });
        }

        const allowedFields = ['productName', 'description', 'category', 'condition', 'fixedPrice', 'quantity', 'imageUrlproduct'];
        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key) && updateData[key] !== undefined) {
                if (key === 'fixedPrice' || key === 'quantity') {
                    product[key] = Number(updateData[key]);
                } else {
                    product[key] = updateData[key];
                }
            }
        });

        await product.save();

        res.status(200).json({
            success: true,
            message: 'تم تحديث المنتج بنجاح',
            product: product
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تحديث المنتج',
            error: err.message
        });
    }
};

/**
 * حذف منتج بسعر ثابت
 */
exports.deleteFixedPriceProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        if (product.sellerId.toString() !== req.user.id && req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية لحذف هذا المنتج'
            });
        }

        await Product.findByIdAndDelete(productId);

        res.status(200).json({
            success: true,
            message: 'تم حذف المنتج بنجاح'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء حذف المنتج',
            error: err.message
        });
    }
};

/**
 * جلب المنتجات حسب النوع (مزاد أو سعر ثابت)
 */
exports.getProductsByType = async (req, res) => {
    try {
        const { type } = req.params;
        const { category, search, minPrice, maxPrice } = req.query;
        
        const filter = { status: 'active' };
        
        if (type === 'auction') {
            filter.$or = [
                { fixedPrice: { $exists: false } },
                { fixedPrice: null },
                { fixedPrice: 0 }
            ];
            filter.auctionEndTime = { $gt: new Date() };
        } else if (type === 'fixed') {
            filter.fixedPrice = { $exists: true, $ne: null, $gt: 0 };
        } else {
            return res.status(400).json({
                success: false,
                message: 'نوع غير صحيح. استخدم "auction" أو "fixed"'
            });
        }

        if (category && category !== 'الكل') {
            filter.category = category;
        }

        if (search) {
            filter.productName = { $regex: search, $options: 'i' };
        }

        if (minPrice || maxPrice) {
            const priceField = type === 'auction' ? 'startingPrice' : 'fixedPrice';
            filter[priceField] = {};
            if (minPrice) filter[priceField].$gte = Number(minPrice);
            if (maxPrice) filter[priceField].$lte = Number(maxPrice);
        }

        const products = await Product.find(filter)
            .populate('sellerId', 'username email phone isVerified')
            .sort({ creationDate: -1 });

        const formattedProducts = products.map(product => {
            const isAuction = type === 'auction';
            return {
                ...product.toObject(),
                isAuction: isAuction,
                inStock: isAuction ? true : product.quantity > 0,
                isVerified: product.sellerId?.isVerified || false,
                sellerName: product.sellerId?.username || 'بائع',
                ...(isAuction && {
                    timeLeft: product.auctionEndTime ? {
                        totalSeconds: Math.floor((new Date(product.auctionEndTime) - new Date()) / 1000)
                    } : null
                })
            };
        });

        res.status(200).json({
            success: true,
            count: formattedProducts.length,
            type: type,
            products: formattedProducts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المنتجات',
            error: error.message
        });
    }
};

// =============================================
// ✅ ✅ ✅ الدالة المطلوبة: جلب المنتجات حسب الحالة (من body)
// =============================================

/**
 * جلب المنتجات حسب الحالة (active, sold, expired)
 * دالة بسيطة تستقبل status من body
 */
exports.getProductsByStatus = async (req, res) => {
    try {
        const { status } = req.body; // active, sold, expired

        // ✅ التحقق من وجود الحالة
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء إرسال الحالة (status) في body'
            });
        }

        // ✅ التحقق من صحة الحالة
        if (!['active', 'sold', 'expired'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'حالة غير صحيحة. استخدم: active, sold, أو expired'
            });
        }

        // ✅ جلب المنتجات حسب الحالة فقط
        const products = await Product.find({
            status: status
        }).populate('sellerId', 'username email phone');

        res.status(200).json({
            success: true,
            status: status,
            count: products.length,
            products: products
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المنتجات',
            error: err.message
        });
    }
};


// =============================================
// ✅ شراء منتج بالدفع عند التوصيل (COD)
// =============================================
exports.createCODPurchase = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const buyerId = req.user.id;

    // 1. جلب المنتج
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "المنتج غير موجود" });
    }

    // 2. التحقق من أن المنتج للبيع (سعر ثابت)
    if (!product.fixedPrice || product.fixedPrice <= 0) {
      return res.status(400).json({ success: false, message: "هذا المنتج ليس للبيع بسعر ثابت" });
    }

    // 3. التحقق من الكمية
    if (product.quantity < quantity) {
      return res.status(400).json({ success: false, message: `الكمية المطلوبة غير متوفرة، المتوفر: ${product.quantity}` });
    }

    // 4. خصم الكمية (لأن الطلب مؤكد عند التوصيل)
    product.quantity -= quantity;
    if (product.quantity === 0) {
      product.status = "expired";
    }
    await product.save();

    // 5. إنشاء Bid (نوع fixed)
    const totalAmount = product.fixedPrice * quantity;
    const bid = new Bid({
      ProductId: product._id,
      userId: buyerId,
      bidAmount: totalAmount,
      bidType: "fixed",
      bidTime: new Date()
    });
    await bid.save();

    // 6. البحث عن مندوب توصيل (اختياري، يمكن تركه null)
    const deliveryUser = await User.findOne({ userType: "delivery" });
    const deliveryId = deliveryUser ? deliveryUser._id : null;

    // 7. إنشاء Order
    const order = new Order({
      productId: product._id,
      bidId: bid._id,
      buyerId: buyerId,
      sellerId: product.sellerId,
      deliveryId: deliveryId, // قد يكون null
      amount: totalAmount,
      quantity: quantity,
      status: "pending", // ✅ معلق حتى يتم الدفع عند التوصيل
      date: new Date(),
      paymentMethod: "cod", // ✅ طريقة الدفع
      deliveryStatus: "pending"
    });
    await order.save();

    // 8. إنشاء Report (مع paid: false لأن الدفع لم يتم بعد)
    const report = new Report({
      productId: product._id,
      bidId: bid._id,
      sellerId: product.sellerId,
      buyerId: buyerId,
      deliveryId: deliveryId,
      deliveryStatus: "pending",
      bidType: "fixed",
      paid: false, // ✅ غير مدفوع
      createdAt: new Date()
    });
    await report.save();

    res.status(201).json({
      success: true,
      message: "تم تأكيد الطلب بنجاح (الدفع عند التوصيل)",
      order: order,
      report: report
    });

  } catch (error) {
    console.error("❌ خطأ في إنشاء طلب COD:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// =============================================
// ✅ دوال إضافية للتقرير
// =============================================
/**
 * جلب أي منتج حسب _id (عام)
 */



exports.getProductById = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId)
            .populate('sellerId', 'username email phone rating isVerified');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        const isAuction = !product.fixedPrice || product.fixedPrice === 0;

        res.status(200).json({
            success: true,
            product: {
                ...product.toObject(),
                isAuction: isAuction,
                inStock: isAuction ? true : product.quantity > 0,
                isVerified: product.sellerId?.isVerified || false,
                sellerName: product.sellerId?.username || 'بائع'
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المنتج',
            error: err.message
        });
    }
};






/**
 * جلب تقارير المبيعات
 */
exports.getSalesReports = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        
        const filter = {};
        
        if (startDate) {
            filter.createdAt = { $gte: new Date(startDate) };
        }
        if (endDate) {
            filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
        }
        if (type && type !== 'all') {
            filter.bidType = type;
        }

        const reports = await Report.find(filter)
            .populate('productId', 'productName fixedPrice startingPrice')
            .populate('sellerId', 'username email')
            .populate('buyerId', 'username email')
            .populate('deliveryId', 'username email')
            .sort({ createdAt: -1 });

        const stats = {
            totalSales: reports.length,
            totalAmount: reports.reduce((sum, r) => sum + (r.productId?.fixedPrice || r.productId?.startingPrice || 0), 0),
            auctionSales: reports.filter(r => r.bidType === 'auction').length,
            fixedSales: reports.filter(r => r.bidType === 'fixed').length,
            pendingDelivery: reports.filter(r => r.deliveryStatus === 'pending').length,
            delivered: reports.filter(r => r.deliveryStatus === 'delivered').length,
            unpaid: reports.filter(r => !r.paid).length
        };

        res.status(200).json({
            success: true,
            stats: stats,
            reports: reports
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب التقارير',
            error: err.message
        });
    }
};

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

/**
 * ✅ إعداد استراتيجية Google
 */
exports.setupGoogleStrategy = () => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            
            if (!email) {
                return done(new Error('لم يتم العثور على البريد الإلكتروني'), null);
            }

            // البحث عن مستخدم موجود
            let user = await User.findOne({ email: email });

            if (!user) {
                // إنشاء مستخدم جديد
                user = new User({
                    username: profile.displayName || profile.name?.givenName || email.split('@')[0],
                    email: email,
                    password: Math.random().toString(36).slice(-8),
                    userType: 'customer',
                    isVerified: true,
                    idImage: profile.photos?.[0]?.value || '',
                    googleId: profile.id,
                    provider: 'google'
                });
                
                await user.save();
                console.log(`✅ تم إنشاء مستخدم جديد عبر Google: ${user.username}`);
            } else {
                // تحديث معلومات المستخدم
                user.googleId = profile.id;
                user.isVerified = true;
                if (profile.photos?.[0]?.value) {
                    user.idImage = profile.photos[0].value;
                }
                await user.save();
                console.log(`✅ تم تسجيل دخول المستخدم عبر Google: ${user.username}`);
            }

            return done(null, user);
        } catch (error) {
            console.error('❌ خطأ في استراتيجية Google:', error);
            return done(error, null);
        }
    }));

    // تسلسل المستخدم
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id).select('-password');
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};

/**
 * ✅ مسار بدء تسجيل الدخول عبر Google
 */
exports.googleAuth = passport.authenticate('google', { 
    scope: ['profile', 'email'] 
});

/**
 * ✅ مسار إعادة التوجيه بعد تسجيل الدخول
 */
exports.googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', { 
        failureRedirect: 'http://localhost:3000/login',
        successRedirect: 'http://localhost:3000/'
    })(req, res, next);
};

/**
 * ✅ جلب مستخدم Google الحالي
 */
exports.getGoogleUser = async (req, res) => {
    try {
        if (req.user) {
            const userObj = req.user.toObject ? req.user.toObject() : req.user;
            delete userObj.password;
            res.json({ success: true, user: userObj });
        } else {
            res.status(401).json({ success: false, message: 'غير موثق' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * ✅ تسجيل الخروج
 */
exports.googleLogout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.redirect('http://localhost:3000/login');
    });
};

/**
 * ✅ إنشاء JWT لمستخدم Google
 */
exports.generateGoogleToken = (user) => {
    return jwt.sign(
        {
            id: user._id || user.id,
            username: user.username,
            userType: user.userType || 'customer',
            email: user.email,
            isVerified: user.isVerified || false
        },
        process.env.JWT_SECRET || 'secretkey',
        { expiresIn: '12h' }
    );
};

/**
 * ✅ تسجيل الدخول عبر Google وإرجاع Token (API)
 */
exports.googleLoginAPI = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'لم يتم العثور على المستخدم' });
        }

        const token = exports.generateGoogleToken(req.user);
        const userObj = req.user.toObject ? req.user.toObject() : req.user;
        delete userObj.password;

        res.json({
            success: true,
            token: token,
            user: userObj
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};