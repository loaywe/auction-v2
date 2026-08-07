import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import React, { useEffect, useState } from 'react'
import { updateUser } from '../../radux/Users'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setShowInfoPanel(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!username || !password) {
      setErrorMessage('الرجاء إدخال اسم المستخدم وكلمة المرور')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', { username, password })
      const user = response.data.user
      const normalizedUser = {
        ...user,
        walletBalance: user.walletBalance ?? user.WalletBalance ?? 0,
        idImage: user.idImage ?? user.imageId ?? "",
      }
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(normalizedUser))
      dispatch(updateUser(normalizedUser))
      navigate('/')
    } catch (error) {
      if (error.response) {
        if (error.response.data.error === 'انتهت مدة اشتراكك، يرجى تجديد الاشتراك') {
          setShowPaymentDialog(true)
        } else {
          setErrorMessage(error.response.data.error)
        }
      } else {
        setErrorMessage('حدث خطأ أثناء الاتصال بالخادم')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStripePayment = async () => {
    try {
      const response = await axios.post('http://localhost:5000/create-newregester-session', {
        username,
        cost: 10,
      })

      if (response.data.url) {
        window.location.href = response.data.url
      } else {
        setErrorMessage('فشل في إنشاء جلسة الدفع')
      }
    } catch (error) {
      console.error('فشل في فتح الدفع:', error)
      setErrorMessage('فشل في فتح الدفع')
    }
  }

  const features = [
    { icon: '🔍', title: 'تصفح المنتجات', description: 'استعرض آلاف المنتجات المتنوعة' },
    { icon: '🏆', title: 'المزايدة', description: 'شارك في المزادات بكل سهولة' },
    { icon: '💰', title: 'البيع', description: 'اعرض منتجاتك للبيع أو المزاد' },
    { icon: '📊', title: 'متابعة', description: 'تتبع مزاداتك ومشترياتك' },
  ]

  return (
    <div className='relative min-h-screen overflow-hidden bg-slate-100 text-slate-900'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),transparent_24%),linear-gradient(180deg,_rgba(241,245,249,0.95),rgba(248,250,252,0.98))]' />
      <div className='relative z-10 mx-auto flex min-h-screen max-w-[1400px] flex-col justify-center px-4 py-10 sm:px-6 lg:px-8'>
        <button
          type='button'
          onClick={() => setShowInfoPanel((prev) => !prev)}
          className='mb-8 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/30 bg-white text-slate-900 shadow-lg shadow-black/20 transition hover:bg-slate-100'
          aria-label='معلومات'
        >
          {showInfoPanel ? '✕' : 'ℹ️'}
        </button>

        <div className='grid gap-10 lg:grid-cols-[1.15fr_0.85fr]'>
          <section className='rounded-[32px] bg-white/95 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl md:p-10'>
            <div className='mb-8 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-3xl text-white shadow-lg shadow-blue-500/20'>🔨</div>
              <h1 className='text-3xl font-semibold text-slate-900'>تسجيل الدخول</h1>
              <p className='mt-3 text-slate-600'>أهلاً بك مجدداً! سجّل الدخول للاستمرار في المنصة.</p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <label htmlFor='username' className='mb-2 block text-sm font-medium text-slate-700'>اسم المستخدم</label>
                <div className='relative'>
                  <input
                    id='username'
                    type='text'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder='أدخل اسم المستخدم'
                    className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  />
                  <span className='pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400'>👤</span>
                </div>
              </div>

              <div>
                <label htmlFor='password' className='mb-2 block text-sm font-medium text-slate-700'>كلمة المرور</label>
                <div className='relative'>
                  <input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='أدخل كلمة المرور'
                    className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword((prev) => !prev)}
                    className='absolute inset-y-0 right-4 inline-flex items-center text-lg text-slate-500 transition hover:text-slate-700'
                  >
                    {showPassword ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className='rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
                  {errorMessage}
                </div>
              )}

              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <label className='inline-flex items-center gap-2 text-sm text-slate-600'>
                  <input type='checkbox' className='h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500' />
                  تذكرني
                </label>
                <a href='#' className='text-sm font-medium text-blue-600 transition hover:text-blue-700'>نسيت كلمة المرور؟</a>
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='inline-flex w-full items-center justify-center rounded-3xl bg-cyan-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-slate-300'
              >
                {isLoading ? 'جارٍ التحميل...' : 'تسجيل الدخول'}
              </button>
            </form>

            <div className='my-8 flex items-center justify-center gap-3 text-sm text-slate-500'>
              <span className='h-px flex-1 bg-slate-200' />
              أو
              <span className='h-px flex-1 bg-slate-200' />
            </div>

            <button
              type='button'
              className='inline-flex w-full items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-700 transition hover:bg-slate-50'
            >
              <span className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600'>G</span>
              تسجيل الدخول باستخدام Google
            </button>

            <p className='mt-8 text-center text-sm text-slate-600'>
              ليس لديك حساب؟{' '}
              <a href='/Signup' className='font-semibold text-blue-600 transition hover:text-blue-700'>إنشاء حساب جديد</a>
            </p>
          </section>

          <aside className='hidden rounded-[32px] bg-white p-8 text-slate-900 shadow-2xl shadow-slate-200/40 backdrop-blur-xl md:block'>
            <div className='mb-8'>
              <h2 className='text-2xl font-semibold text-slate-950'>مزايا منصة المزادات</h2>
              <p className='mt-3 text-slate-600'>اكتشف الميزات التي تساعدك على البيع والشراء بسهولة وسرعة.</p>
            </div>
            <div className='space-y-4'>
              {features.map((feature, index) => (
                <div key={index} className='rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm'>
                  <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-xl text-white'>
                    {feature.icon}
                  </div>
                  <h3 className='text-lg font-semibold text-slate-950'>{feature.title}</h3>
                  <p className='mt-2 text-slate-600'>{feature.description}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <footer className='mt-10 flex flex-col items-center justify-between gap-4 rounded-[28px] bg-white/95 px-6 py-5 text-center text-slate-700 shadow-lg shadow-slate-200/30 sm:flex-row'>
          <p className='text-sm'>&copy; 2026 منصة المزادات العربية - جميع الحقوق محفوظة</p>
          <div className='flex flex-wrap items-center justify-center gap-3 text-sm'>
            <a href='#' className='text-slate-600 transition hover:text-cyan-500'>سياسة الخصوصية</a>
            <span>•</span>
            <a href='#' className='text-slate-600 transition hover:text-cyan-500'>شروط الاستخدام</a>
            <span>•</span>
            <a href='#' className='text-slate-600 transition hover:text-cyan-500'>اتصل بنا</a>
          </div>
        </footer>
      </div>

      {showPaymentDialog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'>
          <div className='w-full max-w-md rounded-[24px] bg-white p-6 text-slate-900 shadow-2xl'>
            <h3 className='mb-4 text-xl font-semibold'>يتطلب اشتراك لتسجيل الدخول</h3>
            <p className='mb-6 text-slate-600'>هل ترغب بالانتقال للدفع الآن؟</p>
            <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <button
                type='button'
                onClick={handleStripePayment}
                className='rounded-3xl bg-green-600 px-5 py-3 text-white transition hover:bg-green-700'
              >
                الدفع
              </button>
              <button
                type='button'
                onClick={() => setShowPaymentDialog(false)}
                className='rounded-3xl bg-slate-200 px-5 py-3 text-slate-900 transition hover:bg-slate-300'
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`fixed inset-y-0 right-0 z-40 w-full max-w-[360px] transform bg-white shadow-2xl transition duration-500 md:w-[360px] ${showInfoPanel ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className='flex h-full flex-col justify-between p-6'>
          <div>
            <div className='mb-6'>
              <h2 className='text-2xl font-semibold text-slate-900'>مرحباً بك في منصة المزادات العربية</h2>
              <p className='mt-3 text-slate-600'>المكان الأمثل للبيع والشراء عبر المزادات الإلكترونية.</p>
            </div>
            <div className='space-y-5'>
              {features.map((feature, index) => (
                <div key={index} className='flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white'>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-900'>{feature.title}</h3>
                    <p className='mt-1 text-sm text-slate-600'>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className='mt-6 rounded-3xl bg-slate-100 p-4 text-sm text-slate-700'>
            <p className='font-medium'>تحتاج مساعدة؟</p>
            <p>تواصل معنا على <a href='mailto:support@auction-platform.com' className='text-blue-600 underline'>support@auction-platform.com</a></p>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default Login
