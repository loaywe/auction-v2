import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    gender: '',
    age: '',
    userType: 'customer'
  });
  
  const [idImage, setIdImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const validateAge = (age) => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum >= 0 && ageNum <= 120;
  };

  const validateGender = (gender) => {
    const allowedGenders = ['male', 'female', 'other'];
    return allowedGenders.includes(gender);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
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
      setError('');
    }
  };

  const validateForm = () => {
    if (!formData.username || !formData.password || !formData.confirmPassword || !formData.email || 
        !formData.phone || !formData.country || !formData.city ||
        !formData.gender || !formData.age) {
      setError('يجب إدخال جميع الحقول المطلوبة');
      return false;
    }

    if (formData.password.length < 8) {
      setError('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return false;
    }

    if (!validateEmail(formData.email)) {
      setError('تنسيق البريد الإلكتروني غير صالح');
      return false;
    }

    if (!validatePhone(formData.phone)) {
      setError('رقم الهاتف يجب أن يتكون من 10 أرقام');
      return false;
    }

    if (!validateGender(formData.gender)) {
      setError('يرجى تحديد الجنس بشكل صحيح');
      return false;
    }

    if (!validateAge(formData.age)) {
      setError('يرجى إدخال عمر صالح');
      return false;
    }

    if (!idImage) {
      setError('الصورة مطلوبة');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const formPayload = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        formPayload.append(key, formData[key]);
      });
      
      // Append image
      formPayload.append('idImage', idImage);

      const response = await axios.post('http://localhost:5000/api/users', formPayload);

      if (response.data.message) {
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          phone: '',
          country: '',
          city: '',
          gender: '',
          age: '',
          userType: 'customer'
        });
        setIdImage(null);
        setError('');
        toast.success('تم إنشاء المستخدم بنجاح');
        navigate('/login');
      }
    } catch (err) {
      const message = err.response?.data?.error || 'حدث خطأ أثناء التسجيل';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir='rtl' className='relative min-h-screen overflow-hidden bg-slate-100 text-slate-900'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(203,213,225,0.5),transparent_24%)]' />
      <div className='pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl' />
      <div className='pointer-events-none absolute right-0 top-16 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl' />

      <main className='relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-5 py-10'>
        <section className='overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-lg shadow-slate-200/30 backdrop-blur-xl sm:p-10'>
          <div className='mb-8 space-y-4'>
            <span className='inline-flex rounded-full bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-500'>تسجيل جديد</span>
            <div>
              <h1 className='text-3xl font-semibold text-slate-950 sm:text-4xl'>
                تسجيل مستخدم جديد
              </h1>
              <p className='mt-3 text-slate-600'>سجل الآن لتحصل على تجربة مزادات عربية متكاملة وسهلة.</p>
            </div>
          </div>

          {error && (
            <div className='mb-6 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='grid gap-6'>
            <div className='grid gap-6 sm:grid-cols-2'>
              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-slate-700'>اسم المستخدم *</span>
                <input
                  type='text'
                  name='username'
                  value={formData.username}
                  onChange={handleChange}
                  placeholder='أدخل اسم المستخدم'
                  required
                  className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                />
              </label>

              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-slate-700'>البريد الإلكتروني *</span>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='example@email.com'
                  required
                  className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                />
              </label>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-slate-700'>كلمة المرور *</span>
                <input
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder='أدخل كلمة المرور'
                  required
                  minLength='8'
                  className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                />
              </label>

              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-slate-700'>تأكيد كلمة المرور *</span>
                <input
                  type='password'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder='أعد إدخال كلمة المرور'
                  required
                  minLength='8'
                  className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                />
              </label>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-slate-700'>رقم الهاتف *</span>
                <input
                  type='tel'
                  name='phone'
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder='05XXXXXXXX'
                  required
                  className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                />
              </label>

              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-slate-700'>البلد *</span>
                <input
                  type='text'
                  name='country'
                  value={formData.country}
                  onChange={handleChange}
                  placeholder='أدخل اسم البلد'
                  required
                  className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                />
              </label>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-slate-700'>المدينة *</span>
                <input
                  type='text'
                  name='city'
                  value={formData.city}
                  onChange={handleChange}
                  placeholder='أدخل اسم المدينة'
                  required
                  className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                />
              </label>

              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-slate-700'>الجنس *</span>
                <select
                  name='gender'
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                >
                  <option value=''>اختر الجنس</option>
                  <option value='male'>ذكر</option>
                  <option value='female'>أنثى</option>
                  <option value='other'>آخر</option>
                </select>
              </label>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-slate-700'>العمر *</span>
                <input
                  type='number'
                  name='age'
                  value={formData.age}
                  onChange={handleChange}
                  placeholder='أدخل عمرك'
                  min='0'
                  max='120'
                  required
                  className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                />
              </label>

            </div>

            <div>
              <span className='mb-2 block text-sm font-semibold text-slate-700'>صورة الهوية *</span>
              <label className='flex cursor-pointer items-center justify-between rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-600 transition hover:border-cyan-400 hover:bg-slate-100'>
                <span>{idImage ? 'تم اختيار صورة' : 'اختر صورة الهوية'}</span>
                <input
                  type='file'
                  name='idImage'
                  onChange={handleFileChange}
                  accept='image/jpeg,image/jpg,image/png'
                  required
                  className='hidden'
                />
              </label>
              {idImage && (
                <div className='mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-3'>
                  <img
                    src={URL.createObjectURL(idImage)}
                    alt='معاينة'
                    className='w-full rounded-2xl object-cover'
                  />
                </div>
              )}
            </div>

            <button
              type='submit'
              disabled={loading}
              className='inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:from-sky-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300'
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل'}
            </button>
          </form>
          <ToastContainer position='top-right' autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={true} pauseOnFocusLoss draggable pauseOnHover theme='light' />
        </section>
      </main>
    </div>
  );
};

export default Register;

