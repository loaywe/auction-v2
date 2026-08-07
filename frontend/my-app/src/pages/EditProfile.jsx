import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

function EditProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useSelector((state) => state.users.user);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address: '',
    gender: 'male',
    age: '',
    userType: 'customer',
  });
  const [idImage, setIdImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  
  // Check if editing another user (admin mode) or self
  const targetUsername = location.state?.username;
  const isAdmin = currentUser?.userType === 'admin';
  const isEditingOtherUser = isAdmin && targetUsername && targetUsername !== currentUser.username;

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!currentUser?.username || !token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      setFetchLoading(true);
      try {
        let userData;
        
        if (isEditingOtherUser) {
          // Fetch the target user's data (admin mode)
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://localhost:5000/admin/users/${targetUsername}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          userData = response.data.user || response.data;
        } else {
          // Use current user's data (self-edit mode)
          userData = currentUser;
        }

        setFormData({
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          gender: userData.gender || 'male',
          age: userData.age || '',
          userType: userData.userType || 'customer',
        });
        setPreview(userData.idImage ? `http://localhost:5000${userData.idImage}` : null);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'فشل في جلب بيانات المستخدم');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, currentUser, targetUsername, isEditingOtherUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة يجب أن يكون أقل من 5MB');
      return;
    }
    
    // Check file type
    const fileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!fileTypes.includes(file.type)) {
      setError('يجب أن تكون الصورة من نوع JPEG, JPG, أو PNG');
      return;
    }

    setIdImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const validateForm = () => {
    if (!formData.email) return 'يرجى إدخال البريد الإلكتروني';
    if (!formData.phone) return 'يرجى إدخال رقم الهاتف';
    if (!formData.address) return 'يرجى إدخال العنوان';
    if (!formData.age) return 'يرجى إدخال العمر';
    if (!formData.userType) return 'يرجى اختيار نوع المستخدم';
    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      return 'يرجى إدخال عمر صالح';
    }
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
      payload.append('email', formData.email);
      payload.append('phone', formData.phone);
      payload.append('address', formData.address);
      payload.append('gender', formData.gender);
      payload.append('age', formData.age);
      payload.append('userType', formData.userType);
      
      if (idImage) {
        payload.append('idImage', idImage);
      }

      let response;
      let usernameToUpdate = isEditingOtherUser ? targetUsername : currentUser.username;

      // Use different endpoint based on whether admin is editing another user
      if (isEditingOtherUser) {
        // Admin editing another user
        response = await axios.patch(
          `http://localhost:5000/admin/users/${usernameToUpdate}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        // User editing their own profile
        // Use the appropriate endpoint based on user type
        const endpointMap = {
          'customer': 'customers',
          'merchant': 'merchants',
          'delivery': 'delivery',
        };
        const endpoint = endpointMap[formData.userType] || 'customers';
        
        response = await axios.patch(
          `http://localhost:5000/api/${endpoint}/${usernameToUpdate}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      setSuccess('تم تحديث البيانات بنجاح');
      
      // If editing own profile, update Redux store
      if (!isEditingOtherUser && response.data) {
        const updatedUser = {
          ...currentUser,
          ...response.data,
          walletBalance: response.data.walletBalance ?? response.data.WalletBalance ?? currentUser.walletBalance,
          idImage: response.data.idImage ?? currentUser.idImage,
        };
        // You can dispatch to Redux here if needed
        // dispatch(updateUser(updatedUser));
      }
      
      // Navigate back based on context
      setTimeout(() => {
        if (isEditingOtherUser) {
          navigate('/datamaneg/users');
        } else {
          navigate('/profile');
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'حدث خطأ أثناء تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-slate-900" dir="rtl">
      <div className="mx-auto w-full max-w-[920px] space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col gap-3 text-right sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">
                {isEditingOtherUser ? `تعديل بيانات المستخدم: ${targetUsername}` : 'تعديل الملف الشخصي'}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {isEditingOtherUser ? 'قم بتحديث بيانات المستخدم وتغيير نوع الحساب.' : 'قم بتحديث بياناتك الشخصية ومعلومات الاتصال.'}
              </p>
            </div>
          </div>

          {error && <div className="mt-6 rounded-3xl bg-rose-50 p-4 text-right text-sm text-rose-700 shadow-sm">{error}</div>}
          {success && <div className="mt-6 rounded-3xl bg-emerald-50 p-4 text-right text-sm text-emerald-700 shadow-sm">{success}</div>}

          {fetchLoading ? (
            <div className="mt-8 flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500"></div>
              <p className="mr-4 text-slate-600">جاري تحميل البيانات...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6 text-right">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  اسم المستخدم
                  <input
                    type="text"
                    value={isEditingOtherUser ? targetUsername : currentUser.username || ''}
                    disabled
                    className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  البريد الإلكتروني
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                    placeholder="البريد الإلكتروني"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  رقم الهاتف
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                    placeholder="رقم الهاتف"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  العنوان
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                    placeholder="العنوان"
                  />
                </label>
               
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  الجنس
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  العمر
                  <input
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                    placeholder="العمر"
                    min="0"
                    max="120"
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-right">
                <label className="block cursor-pointer text-sm font-medium text-slate-700">
                  صورة الهوية
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageChange}
                    className="mt-3 hidden"
                  />
                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 text-center transition hover:border-cyan-400">
                    {preview ? (
                      <img src={preview} alt="preview" className="mx-auto h-40 w-auto rounded-3xl object-cover" />
                    ) : (
                      <p className="text-sm text-slate-500">اضغط لاختيار صورة الهوية (JPG أو PNG)</p>
                    )}
                  </div>
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-w-[180px] items-center justify-center rounded-3xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? 'جاري التحديث...' : 'حفظ التعديلات'}
                </button>
                <button
                  type="button"
                  onClick={() => isEditingOtherUser ? navigate('/datamaneg/users') : navigate('/profile')}
                  className="inline-flex min-w-[180px] items-center justify-center rounded-3xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  {isEditingOtherUser ? 'الرجوع لإدارة المستخدمين' : 'الرجوع للملف الشخصي'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
