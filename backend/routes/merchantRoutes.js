const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { auth, authorizeRoles } = require("../middleware/auth");
const {
    registerMerchant,
    loginMerchant,
    getMerchantProfile,
    updateMerchantProfile,
    // ✅ الدوال الجديدة
    getMerchantProducts,
    createMerchantProduct,
    updateMerchantProduct,
    deleteMerchantProduct,
    getMerchantBids,
    getMerchantOrders,
} = require("../controllers/merchantcontroller");

// =============================================
// ✅ المسارات العامة (بدون مصادقة)
// =============================================
router.post("/register", registerMerchant);
router.post("/login", loginMerchant);

// =============================================
// ✅ الملف الشخصي (بحاجة مصادقة)
// =============================================
// يمكن استخدام /profile بدلاً من /:username لتجنب التعارض مع مسارات المنتجات
router.get("/profile", auth, getMerchantProfile);
router.patch("/profile", auth, upload.single("idImage"), updateMerchantProfile);

// =============================================
// ✅ إدارة المنتجات (بحاجة مصادقة ودور merchant)
// =============================================
router.get("/products", auth, authorizeRoles("merchant"), getMerchantProducts);
router.post("/products", auth, authorizeRoles("merchant"), upload.single("image"), createMerchantProduct);
router.put("/products/:id", auth, authorizeRoles("merchant"), upload.single("image"), updateMerchantProduct);
router.delete("/products/:id", auth, authorizeRoles("merchant"), deleteMerchantProduct);

// =============================================
// ✅ متابعة المزايدات على منتجات التاجر
// =============================================
router.get("/bids", auth, authorizeRoles("merchant"), getMerchantBids);

// =============================================
// ✅ تقارير المبيعات (الطلبات)
// =============================================
router.get("/orders", auth, authorizeRoles("merchant"), getMerchantOrders);

module.exports = router;