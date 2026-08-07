import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const baseUrl = 'http://localhost:5000';
const CATEGORIES = ['إلكترونيات', 'العقارات', 'مركبات', 'أزياء', 'أثاث', 'اخرى'];

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
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
    status: 'active',
    rating: '',
    quantity: '1',
    imageUrlproduct: null,
  });

  console.log('🔍 ===== EditProduct Debug =====');
  console.log('📌 ID from useParams():', id);
  console.log('📌 Current URL:', window.location.href);
  console.log('📌 Full API URL:', `${baseUrl}/admin/products/${id}`);
  console.log('🔍 ================================');

  // ✅ جلب قائمة التجار
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('⚠️ No token found for fetching merchants');
          return;
        }
        
        const response = await axios.get(`${baseUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const users = response.data || [];
        setMerchants(users.filter((u) => u.userType === 'merchant'));
        console.log(`✅ تم جلب ${merchants.length} تاجر`);
      } catch (err) {
        console.error('❌ فشل جلب التجار:', err);
      }
    };
    fetchMerchants();
  }, []);

  // ✅ جلب بيانات المنتج للتعديل
  useEffect(() => {
    if (user?.userType !== 'admin') {
      navigate('/login');
      return;
    }

    if (!id) {
      setError('❌ معرف المنتج غير موجود في الرابط');
      setLoading(false);
      return;
    }

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      setError('❌ صيغة معرف المنتج غير صحيحة');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('❌ يرجى تسجيل الدخول مرة أخرى');
          setLoading(false);
          return;
        }

        console.log(`🔍 جلب المنتج بالـ ID: ${id}`);
        
        const response = await axios.get(`${baseUrl}/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const product = response.data;
        console.log('✅ Product data received:', product);
        
        if (!product) {
          setError('❌ المنتج غير موجود');
          setLoading(false);
          return;
        }
        
        setFormData({
          sellerId: product.sellerId?._id || product.sellerId || '',
          productName: product.productName || '',
          description: product.description || '',
          category: product.category || 'إلكترونيات',
          condition: product.condition || 'new',
          startingPrice: product.startingPrice || '',
          fixedPrice: product.fixedPrice || '',
          auctionEndTime: product.auctionEndTime ? new Date(product.auctionEndTime).toISOString().slice(0, 16) : '',
          status: product.status || 'active',
          rating: product.rating || '',
          quantity: product.quantity || '1',
          imageUrlproduct: null,
        });
        
        if (product.imageUrlproduct) {
          setOriginalImage(product.imageUrlproduct);
          setPreview(`${baseUrl}${product.imageUrlproduct}`);
        }
        
        setLoading(false);
        console.log('✅ Product loaded successfully');
      } catch (err) {
        console.error('❌ Error fetching product:', err);
        setError(err.response?.data?.error || err.message || 'فشل جلب بيانات المنتج');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (!formData.productName || formData.productName.trim() === '') return 'يرجى إدخال اسم المنتج';
    if (!formData.startingPrice || parseFloat(formData.startingPrice) <= 0) return 'يرجى إدخال سعر بداية صحيح (أكبر من 0)';
    
    const hasFixedPrice = formData.fixedPrice && parseFloat(formData.fixedPrice) > 0;
    if (!hasFixedPrice && !formData.auctionEndTime) return 'يرجى تحديد نهاية المزاد';
    
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('📤 Submitting form...');
    
    setError('');
    setSuccess('');

    if (!id) {
      console.error('❌ No ID for update');
      setError('❌ معرف المنتج غير صحيح');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No token for update');
        setError('❌ يرجى تسجيل الدخول مرة أخرى');
        setSubmitting(false);
        return;
      }

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
      } else {
        // ✅ منتج مزاد
        payload.append('auctionEndTime', formData.auctionEndTime);
        payload.append('status', 'active');
      }
      
      // ✅ حقول اختيارية
      if (formData.rating) payload.append('rating', formData.rating);
      if (formData.quantity) payload.append('quantity', formData.quantity);
      payload.append('imageUrlproduct', formData.imageUrlproduct);

      console.log(`📤 Updating product ${id}...`);
      
      // ✅✅✅ استخدم PATCH (الموجود في الخادم) ✅✅✅
      const response = await axios.patch(`${baseUrl}/admin/products/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Update successful:', response.data);
      
      const message = hasFixedPrice 
        ? '✅ تم تحديث المنتج كمنتج بسعر ثابت' 
        : '✅ تم تحديث المنتج للمزاد بنجاح';
      
      setSuccess(message);
      setTimeout(() => navigate('/datamaneg/products'), 1500);
      
    } catch (err) {
      console.error('❌ Error updating product:', err);
      console.error('❌ Response status:', err.response?.status);
      console.error('❌ Response data:', err.response?.data);
      setError(err.response?.data?.error || err.message || 'حدث خطأ أثناء تحديث المنتج');
    } finally {
      setSubmitting(false);
    }
  };

  const hasFixedPrice = formData.fixedPrice && parseFloat(formData.fixedPrice) > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600 mx-auto"></div>
          <p className="mt-6 text-slate-600 text-lg">جاري تحميل بيانات المنتج...</p>
          <p className="mt-2 text-slate-400 text-sm">معرف المنتج: {id || 'غير موجود'}</p>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full">
          <div className="text-7xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-3">حدث خطأ</h2>
          <p className="text-slate-600 mb-2">{error}</p>
          <p className="text-xs text-slate-400 mb-6 break-all">المسار: {window.location.pathname}</p>
          <button
            onClick={() => navigate('/datamaneg/products')}
            className="px-8 py-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 transition font-semibold"
          >
            العودة للمنتجات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-slate-900" dir="rtl">
      <div className="mx-auto w-full max-w-[960px] space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/40">
          <div className="text-right">
            <h1 className="text-3xl font-bold text-slate-950">تعديل المنتج</h1>
            <p className="mt-2 text-sm text-slate-600">
              {hasFixedPrice ? '🛒 تعديل منتج بسعر ثابت' : '🔨 تعديل منتج مزاد'}
            </p>
            <p className="mt-1 text-xs text-slate-400">معرف المنتج: {id}</p>
          </div>

          {error && (
            <div className="mt-6 rounded-3xl bg-rose-50 p-4 text-right text-sm text-rose-700 shadow-sm border border-rose-200">
              ❌ {error}
            </div>
          )}
          
          {success && (
            <div className="mt-6 rounded-3xl bg-emerald-50 p-4 text-right text-sm text-emerald-700 shadow-sm border border-emerald-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6 text-right">
            <div className="grid gap-4 md:grid-cols-2">
              {/* حالة المنتج */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                حالة المنتج
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="active">🟢 نشط</option>
                  <option value="sold">🔴 تم البيع</option>
                  <option value="expired">⏰ منتهي</option>
                  <option value="pending">⏳ قيد الانتظار</option>
                </select>
              </label>

              {/* التاجر */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                التاجر
                <select
                  name="sellerId"
                  value={formData.sellerId}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">اختر التاجر</option>
                  {merchants.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.username} ({m.email})
                    </option>
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
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
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
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  placeholder="وصف المنتج"
                />
              </label>

              {/* الفئة */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                الفئة
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>

              {/* حالة الاستخدام */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                حالة المنتج (الاستخدام)
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
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
                  step="0.01"
                  value={formData.startingPrice}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  placeholder="0.00"
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
                  step="0.01"
                  value={formData.fixedPrice}
                  onChange={handleChange}
                  className={`w-full rounded-3xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                    hasFixedPrice 
                      ? 'border-emerald-400 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-100' 
                      : 'border-slate-200 bg-slate-50 focus:border-cyan-400 focus:ring-cyan-100'
                  }`}
                  placeholder="اتركه فارغاً للمزاد"
                />
                {hasFixedPrice && (
                  <p className="text-xs text-emerald-600 font-medium">✅ منتج بسعر ثابت</p>
                )}
              </label>

              {/* نهاية المزاد */}
              {!hasFixedPrice && (
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  نهاية المزاد
                  <input
                    name="auctionEndTime"
                    type="datetime-local"
                    value={formData.auctionEndTime}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  />
                  <p className="text-xs text-amber-600">⏰ مطلوب لمنتجات المزاد</p>
                </label>
              )}

              {/* التقييم */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                التقييم (0-10)
                <input
                  name="rating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.rating}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
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
                  className={`w-full rounded-3xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                    hasFixedPrice 
                      ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed' 
                      : 'border-slate-200 bg-slate-50 focus:border-cyan-400 focus:ring-cyan-100'
                  }`}
                  disabled={hasFixedPrice}
                />
                {hasFixedPrice && (
                  <p className="text-xs text-slate-400">الكمية ثابتة = 1 للمنتجات ذات السعر الثابت</p>
                )}
              </label>
            </div>

            {/* صورة المنتج */}
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-right transition hover:border-cyan-400">
              <label className="block cursor-pointer text-sm font-medium text-slate-700">
                صورة المنتج
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-3 hidden"
                />
                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 text-center transition hover:border-cyan-400">
                  {preview ? (
                    <img src={preview} alt="معاينة المنتج" className="mx-auto h-48 w-auto rounded-3xl object-cover shadow-md" />
                  ) : (
                    <div className="py-8">
                      <p className="text-4xl mb-2">📸</p>
                      <p className="text-sm text-slate-500">لا توجد صورة</p>
                      <p className="text-xs text-slate-400 mt-1">اضغط لاختيار صورة جديدة</p>
                    </div>
                  )}
                </div>
                {originalImage && !formData.imageUrlproduct && (
                  <p className="mt-2 text-xs text-slate-400">📁 الصورة الحالية: {originalImage.split('/').pop()}</p>
                )}
              </label>
            </div>

            {/* أزرار */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex min-w-[200px] items-center justify-center rounded-3xl px-8 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-50 shadow-md ${
                  hasFixedPrice 
                    ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg' 
                    : 'bg-cyan-600 hover:bg-cyan-700 hover:shadow-lg'
                }`}
              >
                {submitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></span>
                    جاري التحديث...
                  </>
                ) : (
                  '💾 تحديث المنتج'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/datamaneg/products')}
                className="inline-flex min-w-[200px] items-center justify-center rounded-3xl bg-slate-100 px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 hover:shadow-md"
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

export default EditProduct;