const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { auth, authorizeRoles } = require("../middleware/auth");
const {
    registerCustomer,
    loginCustomer,
    getCustomerProfile,
    updateCustomerProfile,
    getMyBids,
    getMyPurchases,
} = require("../controllers/customercontrollar");

// =============================================
// ✅ المسارات العامة (بدون مصادقة)
// =============================================
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// =============================================
// ✅ المسارات المحمية (بحاجة مصادقة)
// =============================================
router.get("/my-bids", auth, authorizeRoles("customer", "merchant"), getMyBids);
router.get("/my-purchases", auth, authorizeRoles("customer", "merchant"), getMyPurchases);

// =============================================
// ✅ الملف الشخصي (مسارات ديناميكية)
// =============================================
router.get("/:username", auth, getCustomerProfile);
router.patch("/:username", auth, upload.single("idImage"), updateCustomerProfile);

module.exports = router;