import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate,useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

function EditUser() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);
    const { user_name } = useParams();

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address: '',
    userType: 'customer',
    gender: 'male',
    age: '',
    isVerified: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.userType !== 'admin') {
      navigate('/login');
      return;
    }

    if (!user_name) {
      navigate('/users');

    console.log(`🔍 Navigating to edit user: ${user_name}`);



      return;
    }

    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/admin/users/${user_name}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = response.data.user || response.data;
        setFormData({
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          userType: userData.userType || 'customer',
          gender: userData.gender || 'male',
          age: userData.age || '',
          isVerified: !!userData.isVerified,
        });
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'حدث خطأ في جلب بيانات المستخدم');
      }
    };

    fetchUser();
  }, [navigate, user, user_name]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:5000/admin/users/${user_name}`,
        {
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          userType: formData.userType,
          gender: formData.gender,
          age: formData.age,
          isVerified: formData.isVerified,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setSuccess('تم تحديث بيانات المستخدم بنجاح');
      setTimeout(() => navigate('/datamaneg/users'), 1400);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'فشل تحديث المستخدم');
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
              <h1 className="text-3xl font-bold text-slate-950">تعديل بيانات المستخدم</h1>
              <p className="mt-2 text-sm text-slate-600">قم بتحديث بيانات المستخدم أو تغيير حالته.</p>
            </div>
          </div>

          {error && <div className="mt-6 rounded-3xl bg-rose-50 p-4 text-right text-sm text-rose-700 shadow-sm">{error}</div>}
          {success && <div className="mt-6 rounded-3xl bg-emerald-50 p-4 text-right text-sm text-emerald-700 shadow-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6 text-right">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                البريد الإلكتروني
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                الهاتف
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                العنوان
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                نوع المستخدم
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                >
                  <option value="customer">عميل</option>
                  <option value="merchant">تاجر</option>
                  <option value="delivery">مندوب</option>
                </select>
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
                />
              </label>
            </div>

            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="isVerified"
                checked={formData.isVerified}
                onChange={handleChange}
                className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              حالة التحقق
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-w-[180px] items-center justify-center rounded-3xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? 'جارٍ التحديث...' : 'حفظ التعديلات'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/datamaneg/users')}
                className="inline-flex min-w-[180px] items-center justify-center rounded-3xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                الرجوع لإدارة المستخدمين
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditUser;
