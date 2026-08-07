import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function About() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);

  const handleSignup = () => {
    navigate('/Signup');
  };

  return (
    <div dir='rtl' className='min-h-screen bg-slate-100 text-slate-900'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(203,213,225,0.5),transparent_20%)]' />
      <div className='relative mx-auto max-w-7xl px-5 py-12'>
        <section className='overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-lg shadow-slate-200/30 backdrop-blur-xl sm:p-12'>
          <div className='grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center'>
            <div className='space-y-6'>
              <span className='inline-flex rounded-full bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300'>عن السوق</span>
              <h1 className='text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl'>سوقكم - منصة التجارة والمزادات الإلكترونية</h1>
              <p className='max-w-2xl text-lg leading-8 text-slate-600'>نحن نوفر بيئة آمنة وحديثة للبيع والشراء عبر الإنترنت، مع تجربة مستخدم عربية متكاملة تناسب الجميع.</p>
              <button onClick={handleSignup} className='inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400'>سجّل الآن</button>
            </div>
            <div className='rounded-[32px] border border-slate-200 bg-slate-50 p-8 shadow-lg shadow-slate-200/30'>
              <h2 className='text-2xl font-semibold text-slate-950'>لماذا تختارنا؟</h2>
              <div className='mt-8 grid gap-4 sm:grid-cols-2'>
                {[
                  { title: 'مزادات حية', description: 'تابع العروض مباشرة وشارك بسهولة في المزادات.' },
                  { title: 'أمان الدفع', description: 'دفع آمن مغطى لحماية البائع والمشتري.' },
                  { title: 'واجهة بسيطة', description: 'تصميم عصري وسهل الاستخدام لجميع الأجهزة.' },
                  { title: 'تنوع الفئات', description: 'من الموبايلات إلى الأثاث والسيارات، كل ما تحتاجه.' },
                ].map((item, index) => (
                  <div key={index} className='rounded-3xl border border-slate-200 bg-slate-50 p-5'>
                    <h3 className='text-lg font-semibold text-slate-950'>{item.title}</h3>
                    <p className='mt-2 text-slate-500'>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className='mt-10 grid gap-6 lg:grid-cols-2'>
          <div className='rounded-[32px] border border-slate-200 bg-slate-50 p-8 shadow-lg shadow-slate-200/30'>
            <h2 className='text-3xl font-semibold text-slate-950'>كيف يعمل الموقع؟</h2>
            <div className='mt-8 grid gap-4'>
              {[
                'سجّل حسابك كبائع أو مشتري.',
                'استعرض المنتجات أو أضف منتجاتك للعرض.',
                'شارك في المزادات أو اشتر مباشرةً.',
                'أكمل الدفع واستلم منتجك بأمان.',
                'تواصل مع البائع وأدّرك تجربة سلسة.',
              ].map((step, index) => (
                <div key={index} className='flex gap-4 rounded-3xl bg-white p-5 border border-slate-200'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-xl font-semibold text-cyan-600'>
                    {index + 1}
                  </div>
                  <p className='text-slate-700'>{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className='space-y-6'>
            <div className='rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-lg shadow-slate-200/30'>
              <h2 className='text-3xl font-semibold text-slate-950'>تفاصيل أكثر</h2>
              <p className='mt-4 text-slate-600 leading-7'>نحن نبني منصة تساعد التجار والمشترين على التواصل الواضح، رفع العروض، وإغلاق الصفقات بثقة كاملة.</p>
            </div>
            {(!user || user.userType === 'visitor') && (
              <div className='rounded-[32px] border border-slate-200 bg-slate-50 p-8 shadow-lg shadow-slate-200/30'>
                <h2 className='text-2xl font-semibold text-slate-950'>جاهز للانضمام؟</h2>
                <p className='mt-3 text-slate-700'>سجّل حسابك الآن وابدأ رحلة التجارة والمزادات الرقمية.</p>
                <button onClick={handleSignup} className='mt-6 inline-flex rounded-full bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400'>إنشاء حساب</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;
