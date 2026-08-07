const express = require("express");
const upload = require("../middleware/upload");
const router = express.Router();

const {
    getAdminUsers,
    getAdminUserByUsername,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser,
    getAdminProducts,
    getAdminProductById,
    createAdminProduct,
    updateAdminProduct,
    deleteAdminProduct,
    getAdminBids,
    getAdminBidById,
    createAdminBid,
    updateAdminBid,
    deleteAdminBid,
    getAdminOrders,
    getAdminOrderById,
    createAdminOrder,
    updateAdminOrder,
    deleteAdminOrder,
    getAdminReports,
    getAdminReportById,
    createAdminReport,
    updateAdminReport,
    deleteAdminReport,
    getAdminAds,
    getAdminAdById,
    createAdminAd,
    updateAdminAd,
    deleteAdminAd,
} = require("../controllers/adminController");

router.get("/products", getAdminProducts);
router.post("/products", upload.single("imageUrlproduct"), createAdminProduct);
router.get("/products/:id", getAdminProductById);
router.patch("/products/:id", upload.single("imageUrlproduct"), updateAdminProduct);
router.delete("/products/:id", deleteAdminProduct);

router.get("/bids", getAdminBids);
router.post("/bids", createAdminBid);
router.get("/bids/:id", getAdminBidById);
router.patch("/bids/:id", updateAdminBid);
router.delete("/bids/:id", deleteAdminBid);

router.get("/orders", getAdminOrders);
router.post("/orders", createAdminOrder);
router.get("/orders/:id", getAdminOrderById);
router.patch("/orders/:id", updateAdminOrder);
router.delete("/orders/:id", deleteAdminOrder);

router.get("/reports", getAdminReports);
router.post("/reports", createAdminReport);
router.get("/reports/:id", getAdminReportById);
router.patch("/reports/:id", updateAdminReport);
router.delete("/reports/:id", deleteAdminReport);

router.get("/ads", getAdminAds);
router.post("/ads", upload.single("imageUrl"), createAdminAd);
router.get("/ads/:id", getAdminAdById);
router.patch("/ads/:id", upload.single("imageUrl"), updateAdminAd);
router.delete("/ads/:id", deleteAdminAd);

router.get("/users", getAdminUsers);
router.post("/users", upload.single("idImage"), createAdminUser);
router.get("/users/:username", getAdminUserByUsername);
router.patch("/users/:username", upload.single("idImage"), updateAdminUser);
router.delete("/users/:username", deleteAdminUser);

router.get("/", getAdminUsers);
router.post("/", upload.single("idImage"), createAdminUser);
router.get("/:username", getAdminUserByUsername);
router.patch("/:username", upload.single("idImage"), updateAdminUser);
router.delete("/:username", deleteAdminUser);

module.exports = router;