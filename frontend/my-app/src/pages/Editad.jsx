import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const baseUrl = 'http://localhost:5000';

function EditAd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [users, setUsers] = useState([]);
  
  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    description: '',
    status: 'active',
    imageUrl: null,
  });

  console.log('🔍 ===== EditAd Debug =====');
  console.log('📌 ID from useParams():', id);
  console.log('📌 Current URL:', window.location.href);
  console.log('📌 User:', user?.username, '(Type:', user?.userType, ')');
  console.log('🔍 ================================');

  // ✅ جلب قائمة المستخدمين
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('⚠️ No token found for fetching users');
          return;
        }
        
        console.log('🔍 Fetching users from:', `${baseUrl}/admin/users`);
        const response = await axios.get(`${baseUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = response.data || [];
        setUsers(usersData);
        console.log(`✅ تم جلب ${usersData.length} مستخدم`);
      } catch (err) {
        console.error('❌ فشل جلب المستخدمين:', err);
        console.error('❌ Response status:', err.response?.status);
      }
    };
    fetchUsers();
  }, []);

  // ✅ جلب بيانات الإعلان للتعديل
  useEffect(() => {
    if (user?.userType !== 'admin') {
      console.warn('⚠️ User is not admin, redirecting to login');
      navigate('/login');
      return;
    }

    if (!id) {
      console.error('❌ No ID found in URL params');
      setError('❌ معرف الإعلان غير موجود في الرابط');
      setLoading(false);
      return;
    }

    // ✅ التحقق من صيغة الـ ID
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.error(`❌ Invalid ID format: ${id}`);
      setError('❌ صيغة معرف الإعلان غير صحيحة');
      setLoading(false);
      return;
    }

    const fetchAd = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('❌ No token found');
          setError('❌ يرجى تسجيل الدخول مرة أخرى');
          setLoading(false);
          return;
        }

        const url = `${baseUrl}/admin/ads/${id}`;
        console.log(`🔍 Fetching ad from: ${url}`);
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const ad = response.data;
        console.log('✅ Ad data received:', ad);
        
        if (!ad || Object.keys(ad).length === 0) {
          console.error('❌ Ad not found');
          setError('❌ الإعلان غير موجود');
          setLoading(false);
          return;
        }
        
        setFormData({
          userId: ad.userId?._id || ad.userId || '',
          title: ad.title || '',
          description: ad.description || '',
          status: ad.status || 'active',
          imageUrl: null,
        });
        
        if (ad.imageUrl) {
          setOriginalImage(ad.imageUrl);
          setPreview(`${baseUrl}${ad.imageUrl}`);
        }
        
        setLoading(false);
        console.log('✅ Ad loaded successfully');
      } catch (err) {
        console.error('❌ Error fetching ad:', err);
        console.error('❌ Response status:', err.response?.status);
        console.error('❌ Request URL:', err.config?.url);
        
        if (err.response?.status === 404) {
          setError(`❌ الإعلان غير موجود (الرابط: ${baseUrl}/admin/ads/${id})`);
        } else if (err.response?.status === 403) {
          setError('❌ ليس لديك صلاحية للوصول لهذا الإعلان');
        } else if (err.response?.status === 401) {
          setError('❌ يرجى تسجيل الدخول مرة أخرى');
        } else {
          setError(err.response?.data?.error || err.message || 'فشل جلب بيانات الإعلان');
        }
        setLoading(false);
      }
    };

    fetchAd();
  }, [id, navigate, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    console.log(`📝 Field ${name} changed to:`, value);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.warn('⚠️ No file selected');
      return;
    }
    
    console.log('📸 New image selected:', file.name);
    setFormData((prev) => ({ ...prev, imageUrl: file }));
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      console.log('✅ Image preview ready');
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    console.log('🔍 Validating form...');
    
    if (!formData.userId) {
      console.warn('⚠️ User ID missing');
      return 'يرجى اختيار المستخدم';
    }
    
    if (!formData.title || formData.title.trim() === '') {
      console.warn('⚠️ Title missing');
      return 'يرجى إدخال عنوان الإعلان';
    }
    
    if (!formData.description || formData.description.trim() === '') {
      console.warn('⚠️ Description missing');
      return 'يرجى إدخال وصف الإعلان';
    }
    
    console.log('✅ Form validation passed');
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('📤 Submitting form...');
    
    setError('');
    setSuccess('');

    if (!id) {
      console.error('❌ No ID for update');
      setError('❌ معرف الإعلان غير صحيح');
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
      
      // ✅ إضافة جميع الحقول
      payload.append('userId', formData.userId);
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('status', formData.status);
      
      // ✅ إضافة الصورة إذا تم اختيار صورة جديدة
      if (formData.imageUrl) {
        payload.append('imageUrl', formData.imageUrl);
        console.log('📸 Added new image');
      }

      const url = `${baseUrl}/admin/ads/${id}`;
      console.log(`📤 Updating ad at: ${url}`);
      
      // ✅ استخدام PATCH للتحديث
      const response = await axios.patch(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Update successful:', response.data);
      setSuccess('✅ تم تحديث الإعلان بنجاح');
      
      setTimeout(() => {
        console.log('🔙 Navigating to ads list');
        navigate('/datamaneg/ads');
      }, 1500);
      
    } catch (err) {
      console.error('❌ Error updating ad:', err);
      console.error('❌ Response status:', err.response?.status);
      console.error('❌ Response data:', err.response?.data);
      
      if (err.response?.status === 404) {
        setError(`❌ الإعلان غير موجود (الرابط: ${baseUrl}/admin/ads/${id})`);
      } else if (err.response?.status === 403) {
        setError('❌ ليس لديك صلاحية لتعديل هذا الإعلان');
      } else if (err.response?.status === 401) {
        setError('❌ يرجى تسجيل الدخول مرة أخرى');
      } else {
        setError(err.response?.data?.error || err.message || 'حدث خطأ أثناء تحديث الإعلان');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600 mx-auto"></div>
          <p className="mt-6 text-slate-600 text-lg">جاري تحميل بيانات الإعلان...</p>
          <p className="mt-2 text-slate-400 text-sm">معرف الإعلان: {id || 'غير موجود'}</p>
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
          <p className="text-xs text-slate-400 mb-6">الـ ID: {id || 'غير موجود'}</p>
          <button
            onClick={() => navigate('/datamaneg/ads')}
            className="px-8 py-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 transition font-semibold"
          >
            العودة للإعلانات
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
            <h1 className="text-3xl font-bold text-slate-950">تعديل الإعلان</h1>
            <p className="mt-2 text-sm text-slate-600">
              🔧 تعديل بيانات الإعلان
            </p>
            <p className="mt-1 text-xs text-slate-400">معرف الإعلان: {id}</p>
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
              
              {/* المستخدم */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                المستخدم
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">اختر المستخدم</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.email}) - {u.userType === 'admin' ? 'مدير' : u.userType === 'merchant' ? 'تاجر' : u.userType === 'customer' ? 'عميل' : u.userType}
                    </option>
                  ))}
                </select>
                {users.length === 0 && (
                  <p className="text-xs text-amber-600">⚠️ لا يوجد مستخدمين متاحين</p>
                )}
              </label>

              {/* حالة الإعلان */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                حالة الإعلان
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="active">🟢 نشط</option>
                  <option value="inactive">🔴 غير نشط</option>
                  <option value="pending">⏳ قيد المراجعة</option>
                </select>
              </label>

              {/* عنوان الإعلان */}
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                عنوان الإعلان
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  placeholder="أدخل عنوان الإعلان"
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
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  placeholder="أدخل وصف الإعلان"
                />
              </label>

            </div>

            {/* صورة الإعلان */}
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-right transition hover:border-cyan-400">
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
                    <img src={preview} alt="معاينة الإعلان" className="mx-auto h-48 w-auto rounded-3xl object-cover shadow-md" />
                  ) : (
                    <div className="py-8">
                      <p className="text-4xl mb-2">📸</p>
                      <p className="text-sm text-slate-500">لا توجد صورة</p>
                      <p className="text-xs text-slate-400 mt-1">اضغط لاختيار صورة جديدة</p>
                    </div>
                  )}
                </div>
                {originalImage && !formData.imageUrl && (
                  <p className="mt-2 text-xs text-slate-400">📁 الصورة الحالية: {originalImage.split('/').pop()}</p>
                )}
                {formData.imageUrl && (
                  <p className="mt-2 text-xs text-emerald-600">✅ تم اختيار صورة جديدة</p>
                )}
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
                  '💾 تحديث الإعلان'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('🔙 Returning to ads list');
                  navigate('/datamaneg/ads');
                }}
                className="inline-flex min-w-[200px] items-center justify-center rounded-3xl bg-slate-100 px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 hover:shadow-md"
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

export default EditAd;