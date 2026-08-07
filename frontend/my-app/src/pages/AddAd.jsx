// src/pages/AddAd.js
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const baseUrl = 'http://localhost:5000';

function AddAd() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);
  
  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    description: '',
    status: 'active',
    imageUrl: null,
  });
  
  const [users, setUsers] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // التحقق من صلاحيات الأدمن
  useEffect(() => {
    if (user?.userType !== 'admin') {
      navigate('/login');
      return;
    }
    fetchUsers();
  }, [navigate, user]);

  // جلب المستخدمين
  const fetchUsers = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${baseUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data || []);
    } catch (err) {
      setError('فشل جلب المستخدمين: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingData(false);
    }
  };

  // معالجة تغيير الحقول
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // معالجة تغيير الصورة
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setFormData((prev) => ({ ...prev, imageUrl: file }));
    
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // التحقق من صحة النموذج
  const validateForm = () => {
    if (!formData.userId) return 'يرجى اختيار المستخدم';
    if (!formData.title) return 'يرجى إدخال عنوان الإعلان';
    if (!formData.description) return 'يرجى إدخال وصف الإعلان';
    if (!formData.imageUrl) return 'يرجى إضافة صورة للإعلان';
    return null;
  };

  // إرسال الإعلان
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
      payload.append('userId', formData.userId);
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('status', formData.status);
      payload.append('imageUrl', formData.imageUrl);

      await axios.post(`${baseUrl}/admin/ads`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('✅ تم إنشاء الإعلان بنجاح');
      setTimeout(() => navigate('/datamaneg/ads'), 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ أثناء إنشاء الإعلان');
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
            <h1 className="text-3xl font-bold text-slate-950">إضافة إعلان جديد</h1>
            <p className="mt-2 text-sm text-slate-600">إنشاء إعلان جديد لعرضه في المتجر.</p>
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
              
              {/* المستخدم */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                المستخدم
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                  required
                >
                  <option value="">اختر المستخدم</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.email}) - {u.userType === 'merchant' ? 'تاجر' : u.userType === 'admin' ? 'مسؤول' : u.userType === 'delivery' ? 'مندوب توصيل' : 'مستخدم'}
                    </option>
                  ))}
                </select>
              </label>

              {/* عنوان الإعلان */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                عنوان الإعلان
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                  placeholder="أدخل عنوان الإعلان"
                  required
                />
              </label>

              {/* وصف الإعلان */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                وصف الإعلان
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                  placeholder="أدخل وصف الإعلان"
                  required
                />
              </label>

              {/* حالة الإعلان */}
              <label className="space-y-2 text-sm font-medium text-slate-700">
                حالة الإعلان
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                >
                  <option value="active">نشط</option>
                  <option value="expired">منتهي</option>
                </select>
              </label>
            </div>

            {/* صورة الإعلان */}
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-right">
              <label className="block cursor-pointer text-sm font-medium text-slate-700">
                صورة الإعلان
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-3 hidden"
                />
                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 text-center transition hover:border-cyan-400">
                  {preview ? (
                    <img
                      src={preview}
                      alt="معاينة الإعلان"
                      className="mx-auto h-48 w-auto rounded-3xl object-cover"
                    />
                  ) : (
                    <div className="py-8">
                      <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-slate-500">اضغط لاختيار صورة الإعلان</p>
                      <p className="text-xs text-slate-400">PNG, JPG, GIF حتى 5MB</p>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* أزرار التحكم */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-w-[180px] items-center justify-center rounded-3xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? 'جاري الإنشاء...' : '📢 إنشاء الإعلان'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/datamaneg/ads')}
                className="inline-flex min-w-[180px] items-center justify-center rounded-3xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                العودة للإعلانات
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddAd;