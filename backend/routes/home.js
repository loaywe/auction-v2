const { User, Product, Bid, Report, Order, Ad } = require("../models/arts.js");

const Home = async (req, res) => {
  try {
    // ✅ جلب المنتجات النشطة
    const activeProducts = await Product.find({
      status: 'sold',
    })
 

    
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
console.log(activeProducts);
    // ✅ جلب الإعلانات الفعالة
    const activeAds = await Ad.find()
    .select('title imageUrl link createdAt')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    // ✅ إرسال البيانات بتنسيق موحد
    res.json({
      success: true,
      data: {
        products: activeProducts,
        ads: activeAds,
        meta: {
          totalProducts: activeProducts.length,
          totalAds: activeAds.length,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ حدث خطأ أثناء جلب البيانات:', error.message);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في الخادم',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = Home;