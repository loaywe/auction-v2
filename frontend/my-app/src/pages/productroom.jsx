import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useSelector } from "react-redux";
import { useNavigate, useParams } from 'react-router-dom';

// ✅ دالة تنسيق الصور
const formatImageUrl = (path) => {
  if (!path) return '/product-placeholder.png';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) return `http://localhost:5000${path}`;
  if (path.startsWith('uploads/')) return `http://localhost:5000/${path}`;
  return `http://localhost:5000/uploads/${path}`;
};

function ProductDetailsFixed() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.users);

  // States
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // جلب بيانات المنتج
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError('قم بالتسجيل');
          setTimeout(() => navigate('/Login'), 2000);
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/users/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const productData = response.data.product || response.data;
        setProduct(productData);
        setLoading(false);
      } catch (error) {
        console.error('❌ فشل في جلب المنتج:', error);
        const errorMsg = error.response?.data?.error || 'حدث خطأ ما';
        setError(errorMsg);
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id, navigate]);

  // تنسيق السعر
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  // =============================================
  // ✅ معالجة الشراء (مُعدل ليتوافق مع الخلفية الجديدة)
  // =============================================
  const handlePurchase = async () => {
    if (!product) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert('❌ يرجى تسجيل الدخول أولاً');
      navigate('/Login');
      return;
    }

    // ✅ التحقق من توفر المنتج (الكمية والحالة)
    if (product.quantity < quantity) {
      alert(`❌ الكمية المطلوبة غير متوفرة، المتوفر: ${product.quantity}`);
      return;
    }
    if (product.status === 'expired') {
      alert('❌ هذا المنتج غير متوفر حالياً (نفد المخزون)');
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === 'online') {
        // ✅ دفع عبر Stripe
        const response = await axios.post(
          'http://localhost:5000/api/wallet/create-product-session',
          {
            productId: product._id,
            quantity: quantity,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { url } = response.data;

        if (url) {
          window.location.href = url;
        } else {
          alert('❌ لم يتم استلام رابط الدفع. حاول مرة أخرى.');
        }
      } else {
        // ✅ دفع عند التوصيل (COD)
        const response = await axios.post(
          'http://localhost:5000/api/users/purchase/cod',
          {
            productId: product._id,
            quantity: quantity,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          alert('✅ تم تأكيد الطلب بنجاح (الدفع عند التوصيل)');
          navigate('/profile/orders');
        } else {
          alert('❌ حدث خطأ في إنشاء الطلب: ' + (response.data.message || ''));
        }
      }
    } catch (error) {
      console.error('❌ خطأ في عملية الشراء:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'حدث خطأ ما';
      alert(`❌ ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // حالات التحميل والخطأ
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-2xl max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl text-red-600 mb-4 font-bold">{error}</h3>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl text-gray-700 font-bold">المنتج غير موجود</h3>
        </div>
      </div>
    );
  }

  // ✅ تحديث حالة نفاد المخزون لتشمل product.status === 'expired'
  const isOutOfStock = (product.quantity || 0) <= 0 || product.status === 'expired';
  const imageUrl = formatImageUrl(product.imageUrlproduct);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        
        {/* صورة المنتج */}
        <div className="relative h-72 md:h-96 bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.productName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/product-placeholder.png';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">
              📦
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              ❌ نفد من المخزون
            </div>
          )}
        </div>

        {/* المحتوى */}
        <div className="p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* العمود الأيمن: تفاصيل المنتج */}
            <div>
              <div className="flex items-start justify-between">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  {product.productName}
                </h1>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                  {product.category || 'عام'}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                <span>📅 {new Date(product.creationDate).toLocaleDateString('ar-SA')}</span>
                <span>•</span>
                <span>{product.condition === 'new' ? 'جديد' : 'مستعمل'}</span>
                <span>•</span>
                <span>المخزون: {product.quantity || 0}</span>
                {product.status === 'expired' && (
                  <span className="text-red-500 font-bold">(منتهي)</span>
                )}
              </div>

              {product.description && (
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="mt-6 border-t pt-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-blue-600">
                    {formatPrice(product.fixedPrice || product.startingPrice)}
                  </span>
                  {product.fixedPrice > 0 && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice((product.fixedPrice || 0) * 1.2)}
                    </span>
                  )}
                </div>
              </div>

              {/* اختيار الكمية */}
              <div className="mt-4 flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">الكمية:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition flex items-center justify-center text-lg font-bold"
                    disabled={isOutOfStock}
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-gray-700">{quantity}</span>
                  <button
                    onClick={() => setQuantity(prev => Math.min(product.quantity || 1, prev + 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition flex items-center justify-center text-lg font-bold"
                    disabled={isOutOfStock}
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-gray-400">(الحد الأقصى: {product.quantity || 0})</span>
              </div>
            </div>

            {/* العمود الأيسر: خيارات الدفع */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💳 اختر طريقة الدفع</h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 cursor-pointer transition hover:border-blue-300">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <span className="font-semibold text-gray-700">💳 دفع مباشر (Stripe)</span>
                    <p className="text-xs text-gray-400">ادفع الآن عبر بطاقة ائتمان أو محفظة رقمية</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 cursor-pointer transition hover:border-blue-300">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <span className="font-semibold text-gray-700">🚚 دفع عند التوصيل (COD)</span>
                    <p className="text-xs text-gray-400">ادفع للمندوب عند استلام المنتج</p>
                  </div>
                </label>
              </div>

              <button
                onClick={handlePurchase}
                disabled={isOutOfStock || isProcessing}
                className={`w-full mt-6 py-3.5 rounded-xl text-white font-bold text-lg transition-all duration-300 ${
                  isOutOfStock
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isProcessing
                    ? 'bg-gray-400 cursor-wait'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري المعالجة...
                  </span>
                ) : isOutOfStock ? (
                  '❌ غير متوفر'
                ) : (
                  '🛒 شراء الآن'
                )}
              </button>

              {paymentMethod === 'cod' && (
                <p className="mt-3 text-xs text-center text-gray-500">
                  سيتم تأكيد الطلب وسنقوم بالتواصل معك لتأكيد التوصيل
                </p>
              )}
              {paymentMethod === 'online' && (
                <p className="mt-3 text-xs text-center text-gray-500">
                  سيتم توجيهك إلى صفحة الدفع الآمنة عبر Stripe
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsFixed;