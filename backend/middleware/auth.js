const jwt = require("jsonwebtoken");

// =============================================
// ✅ المصادقة العامة (JWT)
// =============================================
const auth = (req, res, next) => {
    try {
        let token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        if (token.startsWith('Bearer ')) {
            token = token.slice(7);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        req.user = decoded;
        console.log('✅ تم التحقق من التوكن بنجاح:', decoded);

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// =============================================
// ✅ التحقق من الصلاحيات
// =============================================
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ message: "غير مصرح بالوصول (req.user missing)" });
        }
        if (!req.user.userType) {
            return res.status(403).json({ message: "غير مصرح بالوصول (userType missing)" });
        }
        if (!roles.includes(req.user.userType)) {
            return res.status(403).json({ 
                message: `ليس لديك الصلاحيات المطلوبة. لديك: ${req.user.userType}, المطلوب: ${roles.join(', ')}` 
            });
        }
        next();
    };
};

// =============================================
// ✅ المصادقة عبر Google (Passport) أو JWT
// =============================================
const isAuthenticated = (req, res, next) => {
    // ✅ التحقق من Passport (Google Auth)
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    
    // ✅ التحقق من JWT (Local Auth)
    try {
        let token = req.headers.authorization;
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7);
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
            req.user = decoded;
            return next();
        }
        return res.status(401).json({ message: "غير مصرح بالوصول" });
    } catch (error) {
        return res.status(401).json({ message: "غير مصرح بالوصول" });
    }
};

// =============================================
// ✅ إنشاء JWT لمستخدم Google
// =============================================
const generateTokenForGoogleUser = (user) => {
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

// =============================================
// ✅ التحقق من أن المستخدم هو نفس الشخص
// =============================================
const isOwner = (req, res, next) => {
    const userId = req.params.userId || req.params.id || req.body.userId;
    
    if (!userId) {
        return res.status(400).json({ message: "معرف المستخدم مطلوب" });
    }

    if (req.user && (req.user.id === userId || req.user._id === userId)) {
        return next();
    }

    return res.status(403).json({ message: "ليس لديك صلاحية للوصول إلى هذا المورد" });
};

// =============================================
// ✅ تصدير الدوال
// =============================================
module.exports = { 
    auth, 
    authorizeRoles,
    isAuthenticated,
    generateTokenForGoogleUser,
    isOwner
};