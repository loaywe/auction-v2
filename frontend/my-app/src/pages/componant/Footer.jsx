import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer dir="rtl" className="bg-gradient-to-r from-slate-50 to-white border-t-2 border-cyan-100 mt-auto shadow-lg">
      <div className="container mx-auto px-4 py-10">
        
        {/* الشبكة العلوية - تم تقليلها إلى عمودين */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
          
          {/* القسم الأول: معلومات عن المنصة */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏪</span>
              <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                عن المنصة
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed pr-2 border-r-2 border-cyan-200 pl-4">
              منصة متخصصة في البيع والشراء عبر المزادات والبيع المباشر،
              نوفر بيئة آمنة للمتداولين.
            </p>
          </div>

          {/* القسم الثاني: معلومات التواصل */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📬</span>
              تواصل معنا
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-end text-sm text-slate-600 bg-slate-50 p-3 rounded-xl hover:bg-cyan-50 transition-all duration-300">
                <span dir="ltr" className="text-cyan-700 font-medium">info@example.com</span>
                <span className="text-xl">📧</span>
              </div>
              <div className="flex items-center gap-3 justify-end text-sm text-slate-600 bg-slate-50 p-3 rounded-xl hover:bg-cyan-50 transition-all duration-300">
                <span dir="ltr" className="text-cyan-700 font-medium">+970 566 202 818</span>
                <span className="text-xl">📞</span>
              </div>
              <div className="flex items-center gap-3 justify-end text-sm text-slate-600 bg-slate-50 p-3 rounded-xl hover:bg-cyan-50 transition-all duration-300">
                <span className="text-cyan-700 font-medium">فلسطين - رام الله</span>
                <span className="text-xl">📍</span>
              </div>
            </div>

            {/* أيقونات التواصل الاجتماعي */}
           
          </div>
        </div>

        {/* الخط السفلي - حقوق النشر */}
        <div className="border-t-2 border-cyan-100 mt-10 pt-6 text-center">
          <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3">
            <p className="text-sm text-slate-500">
              © {currentYear} جميع الحقوق محفوظة. 
              <span className="text-cyan-600 font-semibold"> منصة البيع والمزادات</span>
            </p>
      
          </div>
          <p className="text-xs text-slate-400 mt-3">
            ✨ تصميم وتطوير بواسطة فريق المنصة ✨
          </p>
        </div>
      </div>
    </footer>
  );
}