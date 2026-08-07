require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const net = require("net");
const WebSocket = require("ws");
const cron = require("node-cron");
const jwt = require('jsonwebtoken');

// ✅ إضافة Passport و Google
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customerRoutes");
const merchantRoutes = require("./routes/merchantRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const { auth, authorizeRoles } = require("./middleware/auth");

const home = require("./routes/home");

const walletRoutes = require('./wallet');
const userController = require("./controllers/userController");

// ✅ استيراد نماذج قاعدة البيانات
const { User, Product, Bid, Report, Order, Ad, Comment } = require("./models/arts.js");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use('/api/wallet/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// =============================================
// ✅ إعدادات Passport و Google Authentication
// =============================================

// ✅ إعداد الجلسات
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ✅ إعداد Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ استراتيجية Google
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

        let user = await User.findOne({ email: email });

        if (!user) {
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

// ✅ تسلسل المستخدم
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

// =============================================
// ✅ مسارات Google Authentication
// =============================================

// ✅ مسار بدء تسجيل الدخول عبر Google
app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// ✅ مسار إعادة التوجيه بعد تسجيل الدخول
app.get('/auth/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: 'http://localhost:5173/login',
        successRedirect: 'http://localhost:5173/'
    })
);

// ✅ مسار تسجيل الخروج
app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.redirect('http://localhost:5173/login');
    });
});

app.use((req, res, next) => {
    console.log(`🌐 [${req.method}] ${req.url}`);
    if (req.headers.authorization) {
        console.log('📌 Authorization: ✅ Present');
    }
    next();
});

connectDB()
  .then(() => console.log("✅ DB Connected"))
  .catch(err => console.log("❌ DB Error:", err.message));

app.use("/api/wallet", walletRoutes);
app.use("/api/home", home);

app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/merchant", merchantRoutes);
app.use("/api/delivery", deliveryRoutes);

app.use("/admin", (req, res, next) => {
    console.log('🔍 ===== Admin Request =====');
    console.log('📌 Method:', req.method);
    console.log('📌 URL:', req.url);
    console.log('📌 Full Path:', req.originalUrl);
    console.log('📌 Authorization:', req.headers.authorization ? '✅ Present' : '❌ Missing');
    console.log('🔍 =========================');
    next();
}, auth, authorizeRoles('admin'), adminRoutes);

app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Server is running!',
        endpoints: {
            admin: 'http://localhost:5000/admin',
            products: 'http://localhost:5000/admin/products',
            wallet: 'http://localhost:5000/api/wallet',
            webhook: 'http://localhost:5000/api/wallet/webhook',
            users: 'http://localhost:5000/api/users',
            google: {
                auth: 'http://localhost:5000/auth/google',
                callback: 'http://localhost:5000/auth/google/callback',
                logout: 'http://localhost:5000/auth/logout'
            },
            auction: {
                active: 'http://localhost:5000/api/users/auction/active',
                available: 'http://localhost:5000/api/users/auction/available',
                details: 'http://localhost:5000/api/users/auction/:productId/details',
                category: 'http://localhost:5000/api/users/auction/category/:category',
                bid: 'http://localhost:5000/api/users/auction/:productId/bid',
                myBids: 'http://localhost:5000/api/users/my-bids',
                myWon: 'http://localhost:5000/api/users/my-won-auctions'
            }
        },
        stripe: {
            status: process.env.STRIPE_SECRET_KEY ? '✅ Connected' : '❌ Not configured',
            webhook: process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Not set'
        }
    });
});

// =============================================
// ✅ تشغيل المهام المجدولة (Cron Jobs)
// =============================================

cron.schedule('* * * * *', async () => {
    try {
        console.log('🔄 [CRON] جاري معالجة المزادات المنتهية...');
        await userController.autoProcessExpiredAuctions();
    } catch (error) {
        console.error('❌ [CRON] خطأ في معالجة المزادات:', error.message);
    }
});

cron.schedule('0 * * * *', async () => {
    try {
        console.log('🔄 [CRON-BACKUP] جاري معالجة المزادات المنتهية (كل ساعة)...');
        await userController.autoProcessExpiredAuctions();
    } catch (error) {
        console.error('❌ [CRON-BACKUP] خطأ:', error.message);
    }
});

console.log('⏰ تم تفعيل المهام المجدولة للمزادات');

// =============================================
// ✅ WebSocket Server المتكامل للمزادات
// =============================================

const server = http.createServer(app);

// تخزين المتصلين لكل منتج (غرف المزايدة)
let clients = {};

// تخزين الـ intervals لكل عميل للحفاظ على الاتصال
const heartbeatIntervals = new Map();

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    console.log("🟢 WebSocket Client connected");
    ws.isAuthenticated = false;
    ws.user = null;
    ws.productId = null;

    ws.send(JSON.stringify({
        type: "WELCOME",
        message: "Connected to Auction Server"
    }));

    const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        } else {
            clearInterval(heartbeatInterval);
            heartbeatIntervals.delete(ws);
        }
    }, 30000);

    heartbeatIntervals.set(ws, heartbeatInterval);

    ws.on("message", async (msg) => {
        try {
            const data = JSON.parse(msg.toString());
            console.log("📩 WebSocket Message:", data.type);

            if (data.type === 'pong') {
                return;
            }

            if (data.type === 'join') {
                const { token, productId } = data;
                
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    ws.user = decoded;
                    ws.isAuthenticated = true;
                    ws.productId = productId;

                    let userId = ws.user._id || ws.user.id;
                    if (!userId && ws.user.username) {
                        const user = await User.findOne({ username: ws.user.username });
                        if (!user) {
                            return ws.send(JSON.stringify({ type: 'error', message: 'المستخدم غير موجود' }));
                        }
                        ws.idus = user._id;
                        userId = user._id;
                    }

                    if (!clients[productId]) clients[productId] = [];
                    if (!clients[productId].includes(ws)) {
                        clients[productId].push(ws);
                    }

                    const product = await Product.findById(productId);
                    if (!product) {
                        return ws.send(JSON.stringify({ type: 'error', message: 'المنتج غير موجود' }));
                    }

                    const allBids = await Bid.find({ ProductId: productId })
                        .populate('userId', 'username idImage')
                        .sort({ bidAmount: -1 });

                    const biddersInfo = allBids.map(bid => ({
                        username: bid.userId?.username || 'مستخدم',
                        image: bid.userId?.idImage || null,
                        amount: bid.bidAmount,
                    }));

                    const comments = await Comment.find({ productId })
                        .populate('userId', 'username idImage')
                        .sort({ createAt: -1 });

                    ws.send(JSON.stringify({
                        type: 'init',
                        product,
                        bidders: biddersInfo,
                        comments: comments.map(c => ({
                            text: c.commentText,
                            user: c.userId?.username || 'مستخدم',
                            image: c.userId?.idImage || null,
                            createdAt: c.createAt,
                        })),
                    }));

                    console.log(`✅ User joined product: ${productId}`);

                } catch (err) {
                    console.error('❌ Join error:', err.message);
                    ws.send(JSON.stringify({ type: 'error', message: 'توكن غير صالح' }));
                }
                return;
            }

            if (!ws.isAuthenticated) {
                return ws.send(JSON.stringify({ type: 'error', message: 'المصادقة مطلوبة' }));
            }

            if (data.type === 'PLACE_BID') {
                const { productId, amount } = data;
                
                let userId = '';
                if (ws.user.username) {
                    const user = await User.findOne({ username: ws.user.username });
                    if (!user) {
                        return ws.send(JSON.stringify({ type: 'error', message: 'المستخدم غير موجود' }));
                    }
                    userId = user._id;
                }

                const product = await Product.findById(productId);
                if (!product || product.status !== 'active') {
                    return ws.send(JSON.stringify({ type: 'error', message: 'المنتج غير متاح للمزايدة' }));
                }

                if (String(product.sellerId) === String(userId)) {
                    return ws.send(JSON.stringify({ type: 'error', message: 'لا يمكنك المزايدة على منتجك الخاص' }));
                }

                const currentBid = await Bid.find({ ProductId: productId })
                    .sort({ bidAmount: -1 })
                    .limit(1)
                    .populate('userId');

                if (currentBid[0] && amount <= currentBid[0].bidAmount) {
                    return ws.send(JSON.stringify({ type: 'error', message: 'يجب أن تكون المزايدة أعلى من الحالية' }));
                }

                const bidder = await User.findById(userId);
                if (!bidder) {
                    return ws.send(JSON.stringify({ type: 'error', message: 'المستخدم غير موجود' }));
                }

                if (bidder.WalletBalance < amount) {
                    return ws.send(JSON.stringify({ type: 'error', message: 'رصيد المحفظة غير كافٍ' }));
                }

                if (currentBid[0]) {
                    const previousBidder = await User.findById(currentBid[0].userId._id);
                    if (previousBidder) {
                        previousBidder.WalletBalance += currentBid[0].bidAmount;
                        await previousBidder.save();
                    }
                }

                bidder.WalletBalance -= amount;
                await bidder.save();

                await product.save();

                await Bid.create({
                    ProductId: productId,
                    userId: userId,
                    bidAmount: amount,
                    bidType: 'auction',
                });

                if (clients[productId]) {
                    clients[productId].forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'newBid',
                                bidderis: {
                                    amount: amount,
                                    username: bidder.username,
                                    image: bidder.idImage,
                                }
                            }));
                        }
                    });
                }

                console.log(`💰 New bid: ${amount} by ${bidder.username}`);
            }

            if (data.type === 'ADD_COMMENT') {
                const { productId, commentText } = data;
                
                const username = ws.user.username;
                if (!username) {
                    return ws.send(JSON.stringify({ type: 'error', message: 'المستخدم غير موجود' }));
                }

                const user = await User.findOne({ username: username });
                if (!user) {
                    return ws.send(JSON.stringify({ type: 'error', message: 'المستخدم غير موجود' }));
                }

                const userId = user._id;
                const newComment = await Comment.create({ 
                    productId, 
                    userId, 
                    commentText 
                });

                if (clients[productId]) {
                    clients[productId].forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'newComment',
                                comment: {
                                    text: commentText,
                                    user: user.username,
                                    image: user.idImage,
                                    createAt: newComment.createAt || new Date().toISOString(),
                                }
                            }));
                        }
                    });
                }

                console.log(`💬 New comment from ${user.username}`);
            }

        } catch (error) {
            console.error('❌ WebSocket Error:', error.message);
            ws.send(JSON.stringify({ type: 'error', message: 'حدث خطأ في الخادم' }));
        }
    });

    ws.on("close", () => {
        console.log("🔴 WebSocket Client disconnected");
        for (const productId in clients) {
            clients[productId] = clients[productId].filter(client => client !== ws);
        }
        const interval = heartbeatIntervals.get(ws);
        if (interval) {
            clearInterval(interval);
            heartbeatIntervals.delete(ws);
        }
    });
});

console.log('🔌 WebSocket Auction Server ready');

// =============================================
// ✅ تشغيل الخادم
// =============================================

const PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_ATTEMPTS = 10;

const findAvailablePort = (port, attempt = 1) => new Promise((resolve, reject) => {
    if (attempt > MAX_PORT_ATTEMPTS) {
        reject(new Error(`Could not find an available port after ${MAX_PORT_ATTEMPTS} attempts.`));
        return;
    }

    const tester = net.createServer();

    tester.once("error", (error) => {
        if (error.code === "EADDRINUSE") {
            tester.close(() => resolve(findAvailablePort(port + 1, attempt + 1)));
        } else {
            reject(error);
        }
    });

    tester.listen(port, () => {
        tester.close(() => resolve(port));
    });
});

const listenOnPort = (port) => new Promise((resolve, reject) => {
    const onError = (error) => {
        server.off("error", onError);
        reject(error);
    };

    server.once("error", onError);
    server.listen(port, () => {
        server.off("error", onError);
        resolve(port);
    });
});

const startServer = async () => {
    try {
        const availablePort = await findAvailablePort(PORT);
        await listenOnPort(availablePort);
        console.log(`\n🚀 Server running on port ${availablePort}`);
        console.log(`📍 Admin endpoints: http://localhost:${availablePort}/admin`);
        console.log(`📍 Products endpoint: http://localhost:${availablePort}/admin/products`);
        console.log(`📍 Wallet API: http://localhost:${availablePort}/api/wallet`);
        console.log(`📍 Webhook: http://localhost:${availablePort}/api/wallet/webhook`);
        console.log(`📍 WebSocket: ws://localhost:${availablePort}`);
        console.log(`📍 Google Auth: http://localhost:${availablePort}/auth/google`);
        console.log(`💰 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅ Connected' : '❌ Not configured'}`);
        console.log(`📨 Webhook Secret: ${process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Not set'}`);
        console.log(`\n📍 Auction Endpoints:`);
        console.log(`   - Active: http://localhost:${availablePort}/api/users/auction/active`);
        console.log(`   - Available: http://localhost:${availablePort}/api/users/auction/available`);
        console.log(`   - Bid: http://localhost:${availablePort}/api/users/auction/:productId/bid`);
        console.log(`   - My Bids: http://localhost:${availablePort}/api/users/my-bids`);
        console.log(`   - My Won: http://localhost:${availablePort}/api/users/my-won-auctions`);
        console.log(`\n🔌 WebSocket Events:`);
        console.log(`   - join: { token, productId }`);
        console.log(`   - PLACE_BID: { productId, amount }`);
        console.log(`   - ADD_COMMENT: { productId, commentText }`);
        console.log(`   - init: { product, bidders, comments }`);
        console.log(`   - newBid: { bidderis: { amount, username, image } }`);
        console.log(`   - newComment: { comment: { text, user, image, createAt } }`);
        console.log(`⏰ Cron Jobs: ✅ Active (every minute)\n`);
    } catch (error) {
        console.error("❌ Server error:", error.message || error);
        process.exit(1);
    }
};

startServer();