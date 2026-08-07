const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { auth, authorizeRoles } = require("../middleware/auth");
const {
    registerDelivery,
    loginDelivery,
    getDeliveryProfile,
    updateDeliveryProfile,
    getMyDeliveryOrders,
    confirmDelivery
} = require("../controllers/deliverycontrollers");

// =============================================
// ✅ المسارات العامة (بدون مصادقة)
// =============================================
router.post("/register", registerDelivery);
router.post("/login", loginDelivery);

// =============================================
// ✅ المسارات المحمية (بحاجة مصادقة)
// =============================================

// ✅ مسارات الطلبات (للمندوب فقط) - ضعها أولاً
router.get("/my-orders", auth, authorizeRoles("delivery"), getMyDeliveryOrders);
router.patch("/orders/:orderId/deliver", auth, authorizeRoles("delivery"), confirmDelivery);

// ✅ الملف الشخصي: يسمح للمندوب نفسه أو الأدمن
router.get("/:username", auth, authorizeRoles("delivery", "admin"), getDeliveryProfile);
router.patch("/:username", auth, authorizeRoles("delivery", "admin"), upload.single("idImage"), updateDeliveryProfile);

module.exports = router;