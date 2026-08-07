const mongoose = require('mongoose');

// تعريف مخطط المستخدم
const userSchema = new mongoose.Schema({
  idImage: { type: String }, // البحث عن رابط صورة الهوية
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  userType: { type: String, enum: ['customer', 'merchant', 'admin', 'delivery'], required: true },
  WalletBalance: { type: Number, default: 0 },
  subscriptionDate: { type: Date, default: Date.now }, // تاريخ الاشتراك
  gender: { type: String, enum: ['male', 'female'], required: true },
  idWalletBalance: { type: String },
  age: { type: Number },
  isVerified: { type: Boolean, default: false } // إضافة البحث المتقدم isVerified
});

// إنشاء نموذج المستخدم
const User = mongoose.model('User', userSchema);

// تعريف Schema للمنتج
const productSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productName: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['إلكترونيات', 'العقارات', 'مركبات', 'أزياء', 'أثاث', 'اخرى'] },
  condition: { type: String, enum: ['new', 'used'], required: true },
  startingPrice: { type: Number, required: true },
  fixedPrice: { type: Number },
  auctionEndTime: {
    type: Date,
    required: false,
    validate: {
      validator: function (value) {
        if (!this.fixedPrice || this.fixedPrice === 0) {
          return value != null && value !== undefined;
        }
        return true;
      },
      message: 'auctionEndTime is required for auction products'
    }
  },
  status: { type: String, enum: ['active', 'sold', 'expired'] },
  creationDate: { type: Date, default: Date.now },
  rating: { type: Number, min: 0, max: 10 },
  imageUrlproduct: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 0 }
});

// إنشاء نموذج للمنتج
const Product = mongoose.model('Product', productSchema);

// تعريف مخطط التعليق (Comment)
const commentSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commentText: { type: String, required: true },
  createAt: { type: Date, default: Date.now },
});

const Comment = mongoose.model('Comment', commentSchema);

// تعريف المخطط للمزايدة
const bidSchema = new mongoose.Schema({
  ProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bidAmount: { type: Number, required: true },
  bidType: { type: String, enum: ['fixed', 'auction'], required: true },
  bidTime: { type: Date, default: Date.now }
});

// إنشاء نموذج للمزايدة
const Bid = mongoose.model('Bid', bidSchema);

// تعريف المخطط للإعلانات
const adSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  description: { type: String, required: true },
  createAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'expired'], default: 'active' }
});

// إنشاء نموذج للإعلانات
const Ad = mongoose.model('Ad', adSchema);

// تعريف مخطط الطلب (Order)
const orderSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  bidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', required: true },
  deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  deliveryStatus: { type: String, enum: ['pending', 'delivered'], default: 'pending' },
  // ✅ أضف هذين الحقلين هنا
  paymentMethod: { type: String, enum: ['cod', 'card'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// تعريف مخطط التقرير (Report)
const reportSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  bidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    required: false,
    default: null
  },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // ✅ أصبح غير مطلوب
  deliveryStatus: { type: String, enum: ['pending', 'delivered'], default: 'pending' },
  bidType: { type: String, enum: ['fixed', 'auction'], required: true },
  paid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// إنشاء نموذج للتقرير
const Report = mongoose.model('Report', reportSchema);

// ✅ تصدير جميع النماذج (تأكد من وجود Comment)
module.exports = { User, Product, Bid, Ad, Report, Comment, Order };