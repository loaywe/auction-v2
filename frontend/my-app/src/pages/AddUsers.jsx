import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function AddUsers() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    userType: 'customer',
    gender: 'male',
    age: '',
    idImage: null,
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.userType !== 'admin') {
      navigate('/login');
    }
  }, [navigate, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, idImage: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!formData.username) return 'يرجى إدخال اسم المستخدم';
    if (!formData.email) return 'يرجى إدخال البريد الإلكتروني';
    if (!formData.password) return 'يرجى إدخال كلمة المرور';
    if (formData.password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (formData.password !== formData.confirmPassword) return 'كلمات المرور غير متطابقة';
    if (!formData.phone) return 'يرجى إدخال رقم الهاتف';
    if (!formData.address) return 'يرجى إدخال العنوان';
    if (!formData.idImage) return 'يرجى إضافة صورة الهوية';
    if (!formData.age) return 'يرجى إدخال العمر';
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
      payload.append('username', formData.username);
      payload.append('email', formData.email);
      payload.append('password', formData.password);
      payload.append('phone', formData.phone);
      payload.append('address', formData.address);
      payload.append('userType', formData.userType);
      payload.append('gender', formData.gender);
      payload.append('age', formData.age);
      payload.append('idImage', formData.idImage);

      const response = await axios.post('http://localhost:5000/admin/users', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('تم إضافة المستخدم بنجاح');
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
        userType: 'customer',
        gender: 'male',
        age: '',
        idImage: null,
      });
      setPreview(null);
      setTimeout(() => navigate('/datamaneg/users'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'حدث خطأ أثناء إضافة المستخدم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-slate-900" dir="rtl">
      <div className="mx-auto w-full max-w-[960px] space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col gap-3 text-right sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">إضافة مستخدم جديد</h1>
              <p className="mt-2 text-sm text-slate-600">يمكنك إنشاء مستخدم جديد من هنا. هذه الميزة متاحة لمسؤولي النظام.</p>
            </div>
          </div>

          {error && <div className="mt-6 rounded-3xl bg-rose-50 p-4 text-right text-sm text-rose-700 shadow-sm">{error}</div>}
          {success && <div className="mt-6 rounded-3xl bg-emerald-50 p-4 text-right text-sm text-emerald-700 shadow-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6 text-right">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                اسم المستخدم
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                  placeholder="اسم المستخدم"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                البريد الإلكتروني
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                  placeholder="البريد الإلكتروني"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                كلمة المرور
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                  placeholder="كلمة المرور"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                تأكيد كلمة المرور
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                  placeholder="تأكيد كلمة المرور"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                رقم الهاتف
                <input
                  name="phone"
                  type="tel"
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
                  placeholder="العمر"
                />
              </label>
            </div>

            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-right">
              <label className="block cursor-pointer text-sm font-medium text-slate-700">
                صورة الهوية
                <input
                  type="file"
                  accept="image/*"
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
                {loading ? 'جاري الإضافة...' : 'إضافة المستخدم'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/datamaneg/users')}
                className="inline-flex min-w-[180px] items-center justify-center rounded-3xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                العودة لإدارة المستخدمين
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddUsers;
