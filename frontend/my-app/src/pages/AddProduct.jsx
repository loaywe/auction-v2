import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const baseUrl = 'http://localhost:5000';

const CATEGORIES = ['إلكترونيات', 'العقارات', 'مركبات', 'أزياء', 'أثاث', 'اخرى'];

function AddProduct() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);
  const [merchants, setMerchants] = useState([]);
  const [formData, setFormData] = useState({
    sellerId: '',
    productName: '',
    description: '',
    category: 'إلكترونيات',
    condition: 'new',
    startingPrice: '',
    fixedPrice: '',
    auctionEndTime: '',
    // ❌ إزالة status من هنا - سيتم تحديده في الخادم
    rating: '',
    quantity: '1',
    imageUrlproduct: null,
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [productType, setProductType] = useState('auction'); // 'auction' or 'fixed'

  useEffect(() => {
    if (user?.userType !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchMerchants = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${baseUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const users = response.data || [];
        setMerchants(users.filter((u) => u.userType === 'merchant' ));
      } catch (err) {
        setError(err.response?.data?.error || 'فشل جلب قائمة التجار');
      }
    };

    fetchMerchants();
  }, [navigate, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // ✅ تحديث نوع المنتج عند تغيير السعر الثابت
    if (name === 'fixedPrice') {
      const hasFixedPrice = value && parseFloat(value) > 0;
      setProductType(hasFixedPrice ? 'fixed' : 'auction');
      
      // ✅ إذا كان سعر ثابت، امسح auctionEndTime
      if (hasFixedPrice) {
        setFormData((prev) => ({ ...prev, auctionEndTime: '' }));
      }
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, imageUrlproduct: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!formData.sellerId) return 'يرجى اختيار التاجر';
    if (!formData.productName) return 'يرجى إدخال اسم المنتج';
    if (!formData.startingPrice) return 'يرجى إدخال سعر البداية';
    
    const hasFixedPrice = formData.fixedPrice && parseFloat(formData.fixedPrice) > 0;
    
    // ✅ التحقق حسب نوع المنتج
    if (!hasFixedPrice) {
      // منتج مزاد - يجب أن يكون auctionEndTime موجود
      if (!formData.auctionEndTime) return 'يرجى تحديد نهاية المزاد';
    }
    // ✅ منتج سعر ثابت - لا نحتاج auctionEndTime
    
    if (!formData.imageUrlproduct) return 'يرجى إضافة صورة المنتج';
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload = new FormData();
      const hasFixedPrice = formData.fixedPrice && parseFloat(formData.fixedPrice) > 0;

      // ✅ إضافة البيانات الأساسية
      payload.append('sellerId', formData.sellerId);
      payload.append('productName', formData.productName);
      payload.append('description', formData.description);
      payload.append('category', formData.category);
      payload.append('condition', formData.condition);
      payload.append('startingPrice', formData.startingPrice);
      
      // ✅ السعر الثابت (إذا وجد)
      if (hasFixedPrice) {
        payload.append('fixedPrice', formData.fixedPrice);
        // ✅ لا نرسل status - الخادم سيحددها تلقائياً
        // ✅ لا نرسل auctionEndTime - غير مطلوب للمنتجات ذات السعر الثابت
      } else {
        // ✅ منتج مزاد
        payload.append('auctionEndTime', formData.auctionEndTime);
        // ✅ نرسل status عادي للمزاد
        payload.append('status', 'active');
      }
      
      // ✅ حقول اختيارية
      if (formData.rating) payload.append('rating', formData.rating);
      if (formData.quantity) payload.append('quantity', formData.quantity);
      payload.append('imageUrlproduct', formData.imageUrlproduct);

      await axios.post(`${baseUrl}/admin/products`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const message = hasFixedPrice 
        ? '✅ تم إضافة المنتج كمنتج بسعر ثابت وتم بيعه فوراً' 
        : '✅ تم إضافة المنتج للمزاد بنجاح';
      
      setSuccess(message);
      setTimeout(() => navigate('/datamaneg/products'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'حدث خطأ أثناء إضافة المنتج');
    } finally {
      setLoading(false);
    }
  };

  // ✅ تحديد ما إذا كان هناك سعر ثابت لعرض/إخفاء الحقول
  const hasFixedPrice = formData.fixedPrice && parseFloat(formData.fixedPrice) > 0;

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-slate-900" dir="rtl">
      <div className="mx-auto w-full max-w-[960px] space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/40">
          <div className="text-right">
            <h1 className="text-3xl font-bold text-slate-950">إضافة منتج جديد</h1>
            <p className="mt-2 text-sm text-slate-600">
              {hasFixedPrice 
                ? '🛒 إنشاء منتج بسعر ثابت (سيتم بيعه فوراً)' 
                : '🔨 إنشاء منتج للمزاد'}
            </p>
          </div>

          {error && <div className="mt-6 rounded-3xl bg-rose-50 p-4 text-right text-sm text-rose-700 shadow-sm">{error}</div>}
          {success && <div className="mt-6 rounded-3xl bg-emerald-50 p-4 text-right text-sm text-emerald-700 shadow-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6 text-right">
            <div className="grid gap-4 md:grid-cols-2">
              {/* التاجر */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                التاجر
                <select
                  name="sellerId"
                  value={formData.sellerId}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                >
                  <option value="">اختر التاجر</option>
                  {merchants.map((m) => (
                    <option key={m._id} value={m._id}>{m.username} ({m.email})</option>
                  ))}
                </select>
              </label>

              {/* اسم المنتج */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                اسم المنتج
                <input
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                  placeholder="اسم المنتج"
                />
              </label>

              {/* الوصف */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                الوصف
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                  placeholder="وصف المنتج"
                />
              </label>

              {/* الفئة */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                الفئة
                <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400">
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>

              {/* الحالة */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                حالة المنتج
                <select name="condition" value={formData.condition} onChange={handleChange} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400">
                  <option value="new">جديد</option>
                  <option value="used">مستعمل</option>
                </select>
              </label>

              {/* سعر البداية */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                سعر البداية (ر.س)
                <input 
                  name="startingPrice" 
                  type="number" 
                  min="0" 
                  value={formData.startingPrice} 
                  onChange={handleChange} 
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400" 
                />
              </label>

              {/* السعر الثابت */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  السعر الثابت (ر.س)
                  <span className="text-xs text-slate-400">(اختياري)</span>
                </span>
                <input 
                  name="fixedPrice" 
                  type="number" 
                  min="0" 
                  value={formData.fixedPrice} 
                  onChange={handleChange} 
                  className={`w-full rounded-3xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-400 ${
                    hasFixedPrice ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                  }`} 
                  placeholder="اتركه فارغاً للمزاد"
                />
                {hasFixedPrice && (
                  <p className="text-xs text-emerald-600">✅ سيتم بيع المنتج فوراً بالسعر الثابت</p>
                )}
              </label>

              {/* ✅ نهاية المزاد - تظهر فقط إذا لم يكن هناك سعر ثابت */}
              {!hasFixedPrice && (
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  نهاية المزاد
                  <input 
                    name="auctionEndTime" 
                    type="datetime-local" 
                    value={formData.auctionEndTime} 
                    onChange={handleChange} 
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400" 
                  />
                  <p className="text-xs text-slate-400">⏰ مطلوب لمنتجات المزاد</p>
                </label>
              )}

              {/* ✅ إذا كان سعر ثابت، نظهر رسالة أن الحالة ستكون sold */}
              {hasFixedPrice && (
                <div className="rounded-3xl bg-amber-50 p-4 text-sm text-amber-700 md:col-span-2">
                  ℹ️ هذا المنتج سيتم إنشاؤه بحالة <strong>"تم البيع (sold)"</strong> تلقائياً لأنه بسعر ثابت
                </div>
              )}

              {/* التقييم */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                التقييم (0-10)
                <input 
                  name="rating" 
                  type="number" 
                  min="0" 
                  max="10" 
                  value={formData.rating} 
                  onChange={handleChange} 
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400" 
                  placeholder="اختياري" 
                />
              </label>

              {/* الكمية */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                الكمية
                <input 
                  name="quantity" 
                  type="number" 
                  min="0" 
                  value={formData.quantity} 
                  onChange={handleChange} 
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400" 
                  disabled={hasFixedPrice} // ✅ تعطيل الكمية للمنتجات ذات السعر الثابت
                />
                {hasFixedPrice && (
                  <p className="text-xs text-slate-400">الكمية ثابتة = 1 للمنتجات ذات السعر الثابت</p>
                )}
              </label>
            </div>

            {/* صورة المنتج */}
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-right">
              <label className="block cursor-pointer text-sm font-medium text-slate-700">
                صورة المنتج
                <input type="file" accept="image/*" onChange={handleImageChange} className="mt-3 hidden" />
                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 text-center transition hover:border-cyan-400">
                  {preview ? (
                    <img src={preview} alt="preview" className="mx-auto h-40 w-auto rounded-3xl object-cover" />
                  ) : (
                    <p className="text-sm text-slate-500">اضغط لاختيار صورة المنتج</p>
                  )}
                </div>
              </label>
            </div>

            {/* أزرار */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button 
                type="submit" 
                disabled={loading} 
                className={`inline-flex min-w-[180px] items-center justify-center rounded-3xl px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
                  hasFixedPrice ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-cyan-600 hover:bg-cyan-700'
                }`}
              >
                {loading ? 'جاري الإضافة...' : hasFixedPrice ? '💰 بيع فوري' : '🔨 إضافة للمزاد'}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/datamaneg/products')} 
                className="inline-flex min-w-[180px] items-center justify-center rounded-3xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                العودة للمنتجات
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;