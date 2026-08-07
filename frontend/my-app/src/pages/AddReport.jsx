// src/pages/AddReport.js
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const baseUrl = 'http://localhost:5000';

function AddReport() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);
  
  const [formData, setFormData] = useState({
    productId: '',
    bidId: '',
    sellerId: '',
    buyerId: '',
    deliveryId: '',
    deliveryStatus: 'pending',
    bidType: 'auction',
    paid: false,
  });
  
  const [products, setProducts] = useState([]);
  const [bids, setBids] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // التحقق من صلاحيات الأدمن
  useEffect(() => {
    if (user?.userType !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate, user]);

  // جلب البيانات المطلوبة للتقرير
  const fetchData = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('token');
      
      // جلب المنتجات
      const productsRes = await axios.get(`${baseUrl}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(productsRes.data.products || []);

      // جلب المزايدات
      const bidsRes = await axios.get(`${baseUrl}/admin/bids`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBids(bidsRes.data.bids || []);

      // جلب المستخدمين
      const usersRes = await axios.get(`${baseUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(usersRes.data || []);

    } catch (err) {
      setError('فشل جلب البيانات: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingData(false);
    }
  };

  // ✅ معالجة تغيير المنتج - تعيين البائع تلقائياً
  const handleProductChange = (event) => {
    const productId = event.target.value;
    
    // البحث عن المنتج المختار
    const product = products.find(p => p._id === productId);
    setSelectedProduct(product);
    
    // ✅ تعيين البائع تلقائياً من المنتج
    if (product && product.sellerId) {
      setFormData(prev => ({
        ...prev,
        productId: productId,
        sellerId: product.sellerId._id || product.sellerId,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        productId: productId,
        sellerId: '',
      }));
    }
  };

  // معالجة تغيير الحقول
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // التحقق من صحة النموذج
  const validateForm = () => {
    if (!formData.productId) return 'يرجى اختيار المنتج';
    if (!formData.sellerId) return 'المنتج المختار لا يحتوي على بائع';
    if (!formData.buyerId) return 'يرجى اختيار المشتري';
    return null;
  };

  // دالة لجلب جميع المستخدمين ماعدا المسؤول
  const getAllUsersExceptAdmin = () => {
    return users.filter(u => u.userType !== 'admin');
  };

  // دالة لجلب المستخدمين حسب النوع
  const getUsersByType = (type) => {
    return users.filter(u => u.userType === type);
  };

  // إرسال التقرير
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
      
      const payload = {
        productId: formData.productId,
        bidId: formData.bidId || undefined,
        sellerId: formData.sellerId,
        buyerId: formData.buyerId,
        deliveryId: formData.deliveryId || undefined,
        deliveryStatus: formData.deliveryStatus,
        bidType: formData.bidType,
        paid: formData.paid,
      };

      await axios.post(`${baseUrl}/admin/reports`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setSuccess('✅ تم إنشاء التقرير بنجاح');
      setTimeout(() => navigate('/datamaneg/reports'), 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ أثناء إنشاء التقرير');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-slate-900" dir="rtl">
      <div className="mx-auto w-full max-w-[960px] space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/40">
          <div className="text-right">
            <h1 className="text-3xl font-bold text-slate-950">إضافة تقرير جديد</h1>
            <p className="mt-2 text-sm text-slate-600">إنشاء تقرير جديد لتتبع عمليات البيع والتوصيل.</p>
          </div>

          {error && (
            <div className="mt-6 rounded-3xl bg-rose-50 p-4 text-right text-sm text-rose-700 shadow-sm">
              ❌ {error}
            </div>
          )}
          
          {success && (
            <div className="mt-6 rounded-3xl bg-emerald-50 p-4 text-right text-sm text-emerald-700 shadow-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6 text-right">
            <div className="grid gap-4 md:grid-cols-2">
              
              {/* ✅ المنتج - مع تعيين البائع تلقائياً */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                المنتج
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleProductChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                  required
                >
                  <option value="">اختر المنتج</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.productName}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✅ البائع: {selectedProduct.sellerId?.username || 'غير معروف'}
                  </p>
                )}
              </label>

              {/* ✅ البائع - مخفي ولكن قيمته محددة تلقائياً */}
              <input
                type="hidden"
                name="sellerId"
                value={formData.sellerId}
              />

              {/* المزايدة */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                المزايدة (اختياري)
                <select
                  name="bidId"
                  value={formData.bidId}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                >
                  <option value="">بدون مزايدة</option>
                  {bids.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.ProductId?.productName || 'غير معروف'} - {b.bidAmount} ر.س
                    </option>
                  ))}
                </select>
              </label>

              {/* المشتري */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                المشتري
                <select
                  name="buyerId"
                  value={formData.buyerId}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                  required
                >
                  <option value="">اختر المشتري</option>
                  {getAllUsersExceptAdmin().map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                </select>
              </label>

              {/* مندوب التوصيل */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                مندوب التوصيل (اختياري)
                <select
                  name="deliveryId"
                  value={formData.deliveryId}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                >
                  <option value="">بدون مندوب</option>
                  {getUsersByType('delivery').map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                </select>
              </label>

              {/* حالة التوصيل */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                حالة التوصيل
                <select
                  name="deliveryStatus"
                  value={formData.deliveryStatus}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </label>

              {/* نوع المزايدة */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                نوع المزايدة
                <select
                  name="bidType"
                  value={formData.bidType}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                >
                  <option value="auction">مزاد</option>
                  <option value="fixed">سعر ثابت</option>
                </select>
              </label>

              {/* تم الدفع */}
              <label className="space-y-2 text-sm font-medium text-slate-700 flex items-center gap-4 pt-6">
                <span>تم الدفع</span>
                <input
                  type="checkbox"
                  name="paid"
                  checked={formData.paid}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
              </label>
            </div>

            {/* أزرار التحكم */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-w-[180px] items-center justify-center rounded-3xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? 'جاري الإنشاء...' : '📊 إنشاء التقرير'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/datamaneg/reports')}
                className="inline-flex min-w-[180px] items-center justify-center rounded-3xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                العودة للتقارير
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddReport;