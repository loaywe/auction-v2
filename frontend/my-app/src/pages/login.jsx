import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import React, { useEffect, useState } from 'react'
import { updateUser, updateToken } from '../radux/Users'

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

  // ✅ دالة تسجيل الدخول عبر Google (الإضافة الوحيدة)
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google'
  }

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
      const token = response.data.token
      const normalizedUser = {
        ...user,
        walletBalance: user.walletBalance ?? user.WalletBalance ?? 0,
        idImage: user.idImage ?? user.imageId ?? "",
      }
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(normalizedUser))
      dispatch(updateUser(normalizedUser))
      dispatch(updateToken(token))
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
    <div dir='rtl' className='relative min-h-screen overflow-hidden bg-slate-100 text-slate-900'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(203,213,225,0.5),transparent_24%),linear-gradient(180deg,_rgba(248,250,252,0.96),rgba(248,250,252,0.98))]' />
      <div className='pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl' />
      <div className='pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl' />

      <div className='relative z-10 mx-auto flex min-h-screen max-w-[1400px] flex-col justify-center px-4 py-10 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between gap-4 rounded-full border border-slate-200 bg-white/95 px-5 py-3 text-sm text-slate-900 shadow-lg shadow-slate-200/30 backdrop-blur-xl sm:text-base'>
          <div className='flex items-center gap-3'>
            <span className='inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-lg shadow-lg shadow-cyan-500/20'>ع</span>
            <div>
              <p className='font-semibold text-slate-950'>منصة المزادات العربية</p>
              <p className='text-xs text-slate-500'>واجهتك الذكية للبيع والشراء عبر المزادات</p>
            </div>
          </div>
          <button
            type='button'
            onClick={() => setShowInfoPanel((prev) => !prev)}
            className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition hover:border-slate-300 hover:bg-slate-100'
            aria-label='معلومات'
          >
            {showInfoPanel ? '✕' : 'ℹ️'}
          </button>
        </div>

        <div className='mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]'>
          <section className='rounded-[32px] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/30 backdrop-blur-xl md:p-10'>
            <div className='max-w-xl space-y-6'>
              <span className='inline-flex rounded-full bg-sky-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-sky-500'>أحدث الأساليب</span>
              <h1 className='text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl'>ابدأ مزادك بعرض عصري يجذب المشترين</h1>
              <p className='text-lg leading-8 text-slate-600'>تحكم في كل جانب من تجربتك مع تصميم حديث وسريع، وادخل عالم المزادات الرقمية بثقة تامة.</p>
              <div className='grid gap-4 sm:grid-cols-2'>
                {features.map((feature, index) => (
                  <div key={index} className='rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-lg shadow-slate-200/20'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-2xl text-sky-300'>{feature.icon}</div>
                    <h3 className='mt-4 text-lg font-semibold text-slate-950'>{feature.title}</h3>
                    <p className='mt-2 text-sm leading-6 text-slate-600'>{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className='rounded-[32px] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/30 md:p-10'>
            <div className='mb-8'>
              <div className='mb-4 inline-flex rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20'>تسجيل الدخول الآمن</div>
              <h2 className='text-3xl font-semibold text-slate-950'>مرحباً بك مجدداً</h2>
              <p className='mt-3 text-slate-600'>سجل الدخول الآن للوصول إلى حسابك ومتابعة المزادات بسهولة.</p>
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
                    className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
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
                    className='w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
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
                <div className='rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-900'>
                  {errorMessage}
                </div>
              )}

              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <label className='inline-flex items-center gap-2 text-sm text-slate-600'>
                  <input type='checkbox' className='h-4 w-4 rounded border-slate-300 bg-white text-cyan-500 focus:ring-cyan-400' />
                  تذكرني
                </label>
                <a href='#' className='text-sm font-medium text-cyan-500 transition hover:text-cyan-600'>نسيت كلمة المرور؟</a>
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-3 text-base font-semibold text-slate-950 transition hover:from-sky-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700'
              >
                {isLoading ? 'جارٍ التحميل...' : 'تسجيل الدخول'}
              </button>
            </form>

            <div className='my-8 flex items-center justify-center gap-3 text-sm text-slate-500'>
              <span className='h-px flex-1 bg-slate-300' />
              أو
              <span className='h-px flex-1 bg-slate-300' />
            </div>

            {/* ✅ زر Google مع دالة onClick (الإضافة الوحيدة) */}
            <button
              type='button'
              onClick={handleGoogleLogin}
              className='inline-flex w-full items-center justify-center gap-3 rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 transition hover:border-cyan-400 hover:bg-slate-100'
            >
              <span className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300'>G</span>
              تسجيل الدخول باستخدام Google
            </button>

            <p className='mt-8 text-center text-sm text-slate-600'>
              ليس لديك حساب؟{' '}
              <a href='/Register' className='font-semibold text-cyan-500 transition hover:text-cyan-400'>إنشاء حساب جديد</a>
            </p>
          </section>
        </div>

        <footer className='mt-10 flex flex-col items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white/95 px-6 py-5 text-center text-slate-700 shadow-lg shadow-slate-200/30 sm:flex-row'>
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
          <div className='w-full max-w-md rounded-[28px] border border-cyan-500/20 bg-white p-6 text-slate-900 shadow-2xl shadow-cyan-500/10'>
            <h3 className='mb-4 text-xl font-semibold text-slate-950'>يتطلب اشتراك لتسجيل الدخول</h3>
            <p className='mb-6 text-slate-600'>هل ترغب بالانتقال للدفع الآن؟</p>
            <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <button
                type='button'
                onClick={handleStripePayment}
                className='rounded-3xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:from-emerald-400 hover:to-cyan-400'
              >
                الدفع
              </button>
              <button
                type='button'
                onClick={() => setShowPaymentDialog(false)}
                className='rounded-3xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200'
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`fixed inset-y-0 right-0 z-40 w-full max-w-[360px] transform bg-white/95 shadow-2xl shadow-slate-200/30 transition duration-500 md:w-[380px] ${showInfoPanel ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className='flex h-full flex-col justify-between p-6'>
          <div>
            <div className='mb-6'>
              <h2 className='text-2xl font-semibold text-slate-950'>مرحباً بك في منصة المزادات العربية</h2>
              <p className='mt-3 text-slate-600'>المكان الأمثل للبيع والشراء عبر المزادات الإلكترونية.</p>
            </div>
            <div className='space-y-5'>
              {features.map((feature, index) => (
                <div key={index} className='flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl text-cyan-600'>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{feature.title}</h3>
                    <p className='mt-1 text-sm text-slate-600'>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className='mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700'>
            <p className='font-medium text-slate-950'>تحتاج مساعدة؟</p>
            <p>تواصل معنا على <a href='mailto:support@auction-platform.com' className='text-cyan-500 underline'>support@auction-platform.com</a></p>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default Login