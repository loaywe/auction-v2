import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const baseUrl = 'http://localhost:5000';

function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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
  const [users, setUsers] = useState([]);
  const [bids, setBids] = useState([]);

  console.log('🔍 ===== EditReport Debug =====');
  console.log('📌 ID from useParams():', id);
  console.log('📌 Current URL:', window.location.href);
  console.log('🔍 ================================');

  // ✅ جلب البيانات المطلوبة
  useEffect(() => {
    if (user?.userType !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('❌ يرجى تسجيل الدخول مرة أخرى');
          setLoading(false);
          return;
        }

        // ✅ جلب التقرير الحالي
        const reportRes = await axios.get(`${baseUrl}/admin/reports/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const report = reportRes.data;
        console.log('✅ Report data:', report);

        // ✅ جلب المنتجات
        const productsRes = await axios.get(`${baseUrl}/admin/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(productsRes.data.products || []);

        // ✅ جلب المستخدمين
        const usersRes = await axios.get(`${baseUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersRes.data || []);

        // ✅ جلب المزايدات
        const bidsRes = await axios.get(`${baseUrl}/admin/bids`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBids(bidsRes.data.bids || []);

        // ✅ تعيين البيانات في النموذج
        setFormData({
          productId: report.productId?._id || report.productId || '',
          bidId: report.bidId?._id || report.bidId || '',
          sellerId: report.sellerId?._id || report.sellerId || '',
          buyerId: report.buyerId?._id || report.buyerId || '',
          deliveryId: report.deliveryId?._id || report.deliveryId || '',
          deliveryStatus: report.deliveryStatus || 'pending',
          bidType: report.bidType || 'auction',
          paid: report.paid || false,
        });

        setLoading(false);
        console.log('✅ Report loaded successfully');
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setError(err.response?.data?.error || err.message || 'فشل جلب البيانات');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, user]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.productId) return 'يرجى اختيار المنتج';
    if (!formData.sellerId) return 'يرجى اختيار البائع';
    if (!formData.buyerId) return 'يرجى اختيار المشتري';
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('📤 Submitting form...');
    
    setError('');
    setSuccess('');

    if (!id) {
      setError('❌ معرف التقرير غير صحيح');
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
        setError('❌ يرجى تسجيل الدخول مرة أخرى');
        setSubmitting(false);
        return;
      }

      // ✅ إرسال البيانات كـ JSON (ليس FormData)
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

      console.log(`📤 Updating report ${id}...`);
      console.log('📦 Payload:', payload);
      
      const response = await axios.patch(`${baseUrl}/admin/reports/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Update successful:', response.data);
      setSuccess('✅ تم تحديث التقرير بنجاح');
      
      setTimeout(() => {
        navigate('/datamaneg/reports');
      }, 1500);
      
    } catch (err) {
      console.error('❌ Error updating report:', err);
      console.error('❌ Response status:', err.response?.status);
      console.error('❌ Response data:', err.response?.data);
      setError(err.response?.data?.error || err.message || 'حدث خطأ أثناء تحديث التقرير');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600 mx-auto"></div>
          <p className="mt-6 text-slate-600 text-lg">جاري تحميل بيانات التقرير...</p>
          <p className="mt-2 text-slate-400 text-sm">معرف التقرير: {id || 'غير موجود'}</p>
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
          <button
            onClick={() => navigate('/datamaneg/reports')}
            className="px-8 py-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 transition font-semibold"
          >
            العودة للتقارير
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
            <h1 className="text-3xl font-bold text-slate-950">تعديل التقرير</h1>
            <p className="mt-2 text-sm text-slate-600">🔧 تعديل بيانات التقرير</p>
            <p className="mt-1 text-xs text-slate-400">معرف التقرير: {id}</p>
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
              
              {/* المنتج */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                المنتج
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">اختر المنتج</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.productName} - {p.category}
                    </option>
                  ))}
                </select>
              </label>

              {/* المزايدة (اختياري) */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                المزايدة (اختياري)
                <select
                  name="bidId"
                  value={formData.bidId}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">اختر المزايدة (اختياري)</option>
                  {bids.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bidAmount} ر.س - {b.bidType}
                    </option>
                  ))}
                </select>
              </label>

              {/* البائع */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                البائع
                <select
                  name="sellerId"
                  value={formData.sellerId}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">اختر البائع</option>
                  {users
                    .filter((u) => u.userType === 'merchant' || u.userType === 'seller')
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username} ({u.email})
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
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">اختر المشتري</option>
                  {users
                    .filter((u) => u.userType === 'customer' || u.userType === 'buyer')
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username} ({u.email})
                      </option>
                    ))}
                </select>
              </label>

              {/* موظف التوصيل (اختياري) */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                موظف التوصيل (اختياري)
                <select
                  name="deliveryId"
                  value={formData.deliveryId}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">اختر موظف التوصيل (اختياري)</option>
                  {users
                    .filter((u) => u.userType === 'delivery')
                    .map((u) => (
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
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="pending">⏳ قيد الانتظار</option>
                  <option value="in_progress">🚚 قيد التوصيل</option>
                  <option value="delivered">✅ تم التوصيل</option>
                  <option value="cancelled">❌ ملغي</option>
                </select>
              </label>

              {/* نوع المزايدة */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                نوع المزايدة
                <select
                  name="bidType"
                  value={formData.bidType}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="auction">مزاد</option>
                  <option value="fixed">سعر ثابت</option>
                </select>
              </label>

              {/* تم الدفع */}
              <label className="space-y-2 text-sm font-medium text-slate-700 flex items-center gap-3">
                <input
                  type="checkbox"
                  name="paid"
                  checked={formData.paid}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span>تم الدفع</span>
              </label>
            </div>

            {/* أزرار */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-w-[200px] items-center justify-center rounded-3xl px-8 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-50 shadow-md bg-cyan-600 hover:bg-cyan-700 hover:shadow-lg"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></span>
                    جاري التحديث...
                  </>
                ) : (
                  '💾 تحديث التقرير'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/datamaneg/reports')}
                className="inline-flex min-w-[200px] items-center justify-center rounded-3xl bg-slate-100 px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 hover:shadow-md"
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

export default EditReport;