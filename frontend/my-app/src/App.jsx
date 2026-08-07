import './App.css';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { updateUser, clearUser } from "./radux/Users";
import { useNavigate } from 'react-router-dom';

import Ads from "./pages/componant/Ads";
import ProductComplex from "./pages/componant/prodectcomlex";

// ✅ دالة لتنسيق مسار الصور - إضافة /uploads/
const formatImageUrl = (path) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;

  return `http://localhost:5000${path}`;
};

// ✅ دالة موحدة لمسارات API
const API_BASE_URL = 'http://localhost:5000';

const UserAccountModal = ({ user, onClose, onProfile, onLogout, navigate }) => (
  <div className='space-y-4'>
    <div className='flex items-center justify-between'>
      <h2 className='text-xl font-semibold text-slate-950'>حالة المستخدم</h2>
      <button
        onClick={onClose}
        className='rounded-full bg-slate-100 px-3 py-1 text-slate-700 transition hover:bg-slate-200'
      >
        إغلاق
      </button>
    </div>
    {user?.username ? (
      <div className='space-y-3'>
        <p className='text-sm text-slate-600'>مرحباً، {user.username}</p>
        <div className='rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700'>
          <p><span className='font-semibold'>نوع المستخدم:</span> {user.userType}</p>
          <p><span className='font-semibold'>البريد:</span> {user.email || 'غير محدد'}</p>
          <p><span className='font-semibold'>الهاتف:</span> {user.phone || 'غير محدد'}</p>
        </div>
        <button
          onClick={onProfile}
          className='w-full rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600'
        >
          الملف الشخصي
        </button>
        <button
          onClick={onLogout}
          className='w-full rounded-3xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600'
        >
          تسجيل الخروج
        </button>
      </div>
    ) : (
      <div className='space-y-3'>
        <p className='text-sm text-slate-600'>يرجى تسجيل الدخول للوصول إلى المنتجات المخصصة.</p>
        <button
          onClick={() => { onClose(); navigate('/login'); }}
          className='w-full rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600'
        >
          تسجيل الدخول
        </button>
        <button
          onClick={() => { onClose(); navigate('/Signup'); }}
          className='w-full rounded-3xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300'
        >
          إنشاء حساب جديد
        </button>
      </div>
    )}
  </div>
);

const PromoCard = ({ message }) => (
  <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/30 transition duration-300 hover:-translate-y-1'>
    <div className='text-4xl text-slate-950'>{message.split(' ')[0]}</div>
    <p className='mt-4 text-sm leading-6 text-slate-600'>{message.split(' ').slice(1).join(' ')}</p>
  </div>
);

function App() {
  const users = useSelector((state) => state.users.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [fashionProducts, setFashionProducts] = useState([]);
  const [furnitureProducts, setFurnitureProducts] = useState([]);
  const [electronicsProducts, setElectronicsProducts] = useState([]);
  
  const modalRef = useRef(null);
  
  // ✅ تنسيق مسار صورة المستخدم مع /uploads/
  const imageUrl = users?.idImage ? formatImageUrl(users.idImage) : '/person.png';
  const shouldShowCartButton = users?.userType === 'customer' || users?.userType === 'merchant';

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        const user = JSON.parse(storedUser);
        const normalizedUser = {
          ...user,
          walletBalance: user.walletBalance ?? user.WalletBalance ?? 0,
          idImage: user.idImage ?? user.imageId ?? "",
        };
        dispatch(updateUser(normalizedUser));
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        localStorage.removeItem("user");
      }
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/api/home`);

        const responseData = response.data.data || response.data;
        
        // ✅ تنسيق مسار الصور في الإعلانات مع /uploads/
        const ads = responseData.ads || [];
        const validAds = ads.map(ad => ({
          ...ad,
          imageUrl: formatImageUrl(ad.imageUrl)
        })).filter(ad => ad && ad.imageUrl);
        
        console.log('📢 الإعلانات:', validAds);
        setItems([...validAds]);

        // ✅ تنسيق مسار الصور في المنتجات مع /uploads/
        const fullProducts = (responseData.products || []).map(product => ({
          ...product,
          images: product.images ? product.images.map(img => formatImageUrl(img)) : [],
          image: product.image ? formatImageUrl(product.image) : null
        }));
        
        console.log('📦 المنتجات:', fullProducts);
        setProducts(fullProducts);
        
        const fashion = fullProducts.filter(product => product.category === 'أزياء').slice(0, 8);
        const furniture = fullProducts.filter(product => product.category === 'أثاث').slice(0, 8);
        const electronics = fullProducts.filter(product => product.category === 'إلكترونيات').slice(0, 8);
        
        const otherCategories = ['أزياء', 'أثاث', 'إلكترونيات'];
        const trending = fullProducts
          .filter(product => !otherCategories.includes(product.category))
          .slice(0, 8);
        
        setTrendingProducts(trending);
        setFashionProducts(fashion);
        setFurnitureProducts(furniture);
        setElectronicsProducts(electronics);
        
        setDisplayedProducts(fullProducts.slice(0, 8));
      } catch (error) {
        console.error('❌ فشل في جلب البيانات:', error);
        setError('حدث خطأ في جلب البيانات، يرجى المحاولة مرة أخرى لاحقاً.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    const handleScrollForButton = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScrollForButton);
    return () => window.removeEventListener('scroll', handleScrollForButton);
  }, [dispatch]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowModal(false);
      }
    };
  
    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  
  const toggleUserModal = () => {
    setShowModal(!showModal);
  };

  const handleLogout = () => {
    dispatch(clearUser());
    localStorage.removeItem('token');
    setShowModal(false);
    navigate('/login');
  };

  const handleProfile = () => {
    setShowModal(false);
    navigate('/profile');
  };
  
  const handleCartClick = () => {
    if (!users?.username) {
      setShowModal(true);
      return;
    }
    
    if (users.userType === 'customer' || users.userType === 'merchant') {
      navigate('/my-products');
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div dir='rtl' className='relative min-h-screen overflow-hidden bg-slate-100 text-slate-900'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(203,213,225,0.5),transparent_24%),linear-gradient(180deg,_rgba(248,250,252,0.96),rgba(248,250,252,1))]' />
      <main className='relative z-10 mx-auto max-w-7xl px-5 py-10'>
        {/* Header */}
        <header className='sticky top-0 z-50 rounded-[32px] border border-slate-200 bg-white/95 px-5 py-4 shadow-lg shadow-slate-200/40 backdrop-blur-xl'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div className='flex items-center gap-3'>
            
            </div>
            <div className='flex items-center gap-3'>
              <button
                onClick={toggleUserModal}
                className='flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-950 transition hover:border-cyan-400 hover:bg-slate-50'
              >
                {users?.username ? (
                  <img src={imageUrl} alt='الصورة الشخصية' className='h-full w-full rounded-full object-cover' />
                ) : (
                  <span className='text-xl'>👤</span>
                )}
              </button>
      
              {shouldShowCartButton && (
                <button
                  onClick={handleCartClick}
                  title={users?.username ? 'عرض منتجاتي' : 'تسجيل الدخول للوصول إلى المنتجات'}
                  className='flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-slate-950 transition hover:bg-cyan-400'
                >
                  <span className='text-xl'>🛍️</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Ads Banner */}
        <div className='mt-6'>
          <div className='mx-auto max-w-7xl'>
            {!loading && items.length > 0 ? (
              <Ads items={items} />
            ) : loading ? (
              <div className='flex justify-center py-10'>
                <div className='h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500'></div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Hero Section */}


        <div className='mx-auto mt-10 max-w-7xl space-y-16'>
          <section className='mt-6 rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-200/20'>
            <div className='mb-6'>
              <h2 className='border-r-4 border-cyan-400 pr-3 text-2xl font-bold text-slate-950'>منتجات متنوعة</h2>
            </div>

            {loading ? (
              <div className='flex flex-col items-center justify-center py-20 text-slate-400'>
                <div className='h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500'></div>
                <p className='mt-4'>جاري تحميل المنتجات...</p>
              </div>
            ) : error ? (
              <div className='rounded-3xl bg-red-500/10 p-10 text-center text-red-100 shadow-lg shadow-red-500/10'>
                <div className='text-5xl mb-4'>⚠️</div>
                <h3 className='mb-4 text-red-200 font-bold'>{error}</h3>
                <button
                  onClick={handleRetry}
                  className='rounded-full bg-red-600 px-6 py-3 text-white transition hover:bg-red-700'
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : trendingProducts.length > 0 ? (
              <ProductComplex products={trendingProducts} />
            ) : (
              <div className='rounded-3xl bg-slate-50 py-16 text-center shadow-lg shadow-slate-200/20'>
                <div className='text-5xl'>🔍</div>
                <h3 className='mt-4 text-slate-600 font-semibold'>لا توجد منتجات رائجة حالياً</h3>
              </div>
            )}
          </section>

          <section className='rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-200/20'>
            <h2 className='mb-6 border-r-4 border-cyan-400 pr-3 text-2xl font-bold text-slate-950'>أزياء رائجة</h2>
            {loading ? (
              <div className='flex flex-col items-center justify-center py-20 text-slate-400'>
                <div className='h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500'></div>
              </div>
            ) : error ? (
              <div className='rounded-3xl bg-red-500/10 p-10 text-center text-red-100 shadow-lg shadow-red-500/10'>
                <h3 className='text-red-200 font-bold'>{error}</h3>
                <button
                  onClick={handleRetry}
                  className='mt-4 inline-flex rounded-full bg-red-600 px-4 py-2 text-white hover:bg-red-700'
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : fashionProducts.length > 0 ? (
              <ProductComplex products={fashionProducts} />
            ) : (
              <div className='rounded-3xl bg-slate-50 py-10 text-center shadow-lg shadow-slate-200/20'>
                <p className='text-slate-600'>لا توجد منتجات أزياء متاحة حالياً</p>
              </div>
            )}
          </section>

          <section className='rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-200/20'>
            <h2 className='mb-6 border-r-4 border-cyan-400 pr-3 text-2xl font-bold text-slate-950'>أثاث منزلي</h2>
            {loading ? (
              <div className='flex justify-center py-20 text-slate-400'>
                <div className='h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500'></div>
              </div>
            ) : furnitureProducts.length > 0 ? (
              <ProductComplex products={furnitureProducts} />
            ) : (
              <div className='rounded-3xl bg-slate-50 py-10 text-center shadow-lg shadow-slate-200/20'>
                <p className='text-slate-600'>لا توجد منتجات أثاث</p>
              </div>
            )}
          </section>

          <section className='rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-200/20'>
            <h2 className='mb-6 border-r-4 border-cyan-400 pr-3 text-2xl font-bold text-slate-950'>إلكترونيات</h2>
            {loading ? (
              <div className='flex justify-center py-20 text-slate-400'>
                <div className='h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500'></div>
              </div>
            ) : electronicsProducts.length > 0 ? (
              <ProductComplex products={electronicsProducts} />
            ) : (
              <div className='rounded-3xl bg-slate-50 py-10 text-center shadow-lg shadow-slate-200/20'>
                <p className='text-slate-600'>لا توجد منتجات إلكترونية</p>
              </div>
            )}
          </section>

          <section className='rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-lg shadow-cyan-200/10'>
            <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-4'>
              <PromoCard message='🛒 تسوق الآن في WE مزاد واحصل على أفضل العروض!' />
              <PromoCard message='📢 قم بالمزايدة الآن ولا تفوّت الفرصة!' />
              <PromoCard message='🔥 منتجات أصلية بأسعار تبدأ من 1 شيكل فقط!' />
              <PromoCard message='🚗 مزادات على سيارات وهواتف وعقارات والمزيد!' />
            </div>
          </section>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div ref={modalRef} className="w-[92%] max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <UserAccountModal 
                user={users} 
                onClose={() => setShowModal(false)} 
                onProfile={handleProfile} 
                onLogout={handleLogout}
                navigate={navigate}
              />
            </div>
          </div>
        )}

        {/* Scroll Top */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 left-6 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
          >
            ↑
          </button>
        )}

      </main>
    </div>
  );
}

export default App;