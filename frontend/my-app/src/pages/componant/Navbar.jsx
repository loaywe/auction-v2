import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useSelector((state) => state.users.user ?? { userType: 'visitor' });
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  let links = [];

  if (user.userType === 'visitor') {
    links = [
      { path: '/Contact', label: 'تواصل معنا' },
      { path: '/login', label: 'تسجيل الدخول' },
      { path: '/About', label: ' عن المزاد' },
      { path: '/', label: 'الرئيسية' },
    ];
  } else if (user.userType === 'delivery') {
    links = [
      { path: '/Contact', label: 'تواصل معنا' },
      { path: '/About', label: ' عن المزاد' },
      { path: '/Report-delivery', label: 'تقارير التوصيل' },
      { path: '/', label: 'الرئيسية' },
    ];
  } else {
    links = [
      { path: '/Contact', label: 'تواصل معنا' },
      { path: '/About', label: ' عن المزاد' },
      { path: '/', label: 'الرئيسية' },
    ];

    if (user.userType === 'admin') {
      links.unshift({ path: '/datamaneg', label: 'إدارة البيانات' });
    } else if (user.userType === 'merchant' || user.userType === 'customer') {
      links.unshift({ path: '/bid', label: 'المزايدات' });
      links.unshift({ path: '/products', label: 'المنتجات' });
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-lg shadow-slate-200/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-4 md:px-6">
        <Link dir="ltr" to="/" className="inline-flex items-center gap-3 text-slate-950 text-2xl font-bold tracking-tight transition hover:text-cyan-500">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-sky-500 text-xl font-black text-slate-950 shadow-lg shadow-cyan-500/20">WE</span>
          <span>مزاد</span>
        </Link>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-950 shadow-inner shadow-slate-200/40 transition hover:bg-slate-200 md:hidden"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation"
        >
          <span className={`block h-0.5 w-6 rounded-full bg-white transition-transform duration-300 ${mobileMenuOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-6 rounded-full bg-white transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
          <span className={`block h-0.5 w-6 rounded-full bg-white transition-transform duration-300 ${mobileMenuOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
        </button>

        <ul className={`absolute inset-x-0 top-full z-40 mt-3 space-y-2 rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 shadow-lg shadow-slate-200/30 transition-all duration-300 md:static md:mt-0 md:flex md:space-y-0 md:flex-row md:items-center md:gap-3 md:border-0 md:bg-transparent md:px-0 md:py-0 ${mobileMenuOpen ? 'block' : 'hidden md:flex'}`}>
          {links.map((link, index) => (
            <li key={index} className="w-full md:w-auto">
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-2 text-center text-sm font-medium text-slate-950 transition hover:bg-cyan-500/10 ${isActive ? 'bg-cyan-500/15 font-semibold text-cyan-700' : ''}`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
