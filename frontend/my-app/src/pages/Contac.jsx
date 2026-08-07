import React from 'react';

const Contact = () => {
  return (
    <div dir='rtl' className='min-h-screen bg-slate-100 text-slate-900'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(203,213,225,0.5),transparent_20%)]' />
      <div className='relative mx-auto max-w-5xl px-5 py-12'>
        <div className='overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 p-10 shadow-lg shadow-slate-200/30 backdrop-blur-xl'>
          <div className='grid gap-10 lg:grid-cols-[0.9fr_0.7fr] items-center'>
            <div>
              <span className='inline-flex rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-500'>تواصل معنا</span>
              <h1 className='mt-6 text-4xl font-bold text-slate-950'>نحن هنا لدعمك</h1>
              <p className='mt-4 max-w-xl text-slate-600 leading-7'>فريق الدعم في سوقكم مستعد للإجابة على استفساراتك ومساعدتك في الحصول على أفضل تجربة شراء أو بيع.</p>
            </div>
            <div className='rounded-[28px] bg-slate-50 p-6 shadow-lg shadow-slate-200/30'>
              <p className='text-sm uppercase tracking-[0.25em] text-cyan-500'>ساعات العمل</p>
              <p className='mt-4 text-3xl font-semibold text-slate-950'>8 صباحًا - 5 مساءً</p>
              <p className='mt-2 text-slate-600'>الأحد حتى الخميس</p>
            </div>
          </div>

          <div className='mt-10 grid gap-6 lg:grid-cols-3'>
            <div className='rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-lg shadow-slate-200/20'>
              <h2 className='text-xl font-semibold text-slate-950'>الهاتف</h2>
              <p className='mt-3 text-slate-600'>+966 12 345 6789</p>
              <a href='tel:+966123456789' className='mt-5 inline-flex rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400'>اتصل الآن</a>
            </div>
            <div className='rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-lg shadow-slate-200/20'>
              <h2 className='text-xl font-semibold text-slate-950'>البريد الإلكتروني</h2>
              <p className='mt-3 text-slate-600'>info@souqkom.com</p>
              <a href='mailto:info@souqkom.com' className='mt-5 inline-flex rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400'>أرسل رسالة</a>
            </div>
            <div className='rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-lg shadow-slate-200/20'>
              <h2 className='text-xl font-semibold text-slate-950'>دعم مباشر</h2>
              <p className='mt-3 text-slate-600'>خدمة العملاء متاحة دائماً للإجابة عن سؤالك ومساعدتك بحلول سريعة.</p>
              <p className='mt-5 text-sm text-slate-500'>نشجعك على إرسال تفاصيل المشكلة لنتمكن من خدمتك بأفضل شكل.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;