import React, { useState, useEffect } from 'react'; // ✅ أضف useEffect
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../radux/Users';
import { useNavigate, useLocation } from 'react-router-dom'; // ✅ أضف useLocation
import axios from 'axios';

function Profile() {
  const user = useSelector((state) => state.users.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // ✅ للحصول على parameters من الرابط
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // ✅ لمنع التحديث المتكرر
  
  // استخراج البيانات
  const imageUrl = user?.idImage ? `http://localhost:5000${user.idImage}` : '/person.png';
  const balance = user?.walletBalance ?? user?.WalletBalance ?? 0;
  const age = user?.age ?? user?.Age ?? 'غير محدد';
  const gender = user?.gender ?? user?.Gender ?? 'غير محدد';
  const accountId = user?._id || user?.id || 'غير متوفر';

  // ✅ دالة جلب بيانات المستخدم المحدثة
  const fetchUpdatedUser = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No token found');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📥 Updated user data:', response.data);
      
      // ✅ تحديث Redux ببيانات المستخدم الجديدة
      dispatch(updateUser(response.data));
      
      // ✅ إزالة parameters من الرابط لتجنب التكرار
      window.history.replaceState({}, document.title, '/profile');
      
      alert('✅ تم إضافة الرصيد بنجاح!');
      
    } catch (error) {
      console.error('❌ فشل في تحديث البيانات:', error);
      if (error.response?.status === 401) {
        // التوكن منتهي الصلاحية
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ تحديث الرصيد تلقائياً عند العودة من Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get('success');
    const sessionId = params.get('session_id');

    if (success === 'true' && sessionId && !isUpdating) {
      console.log('🔄 جاري تحديث الرصيد بعد الدفع الناجح...');
      fetchUpdatedUser();
    }
  }, [location]); // ✅ يتغير عند تغيير الرابط

  // ✅ تعريف دالة handleEditProfile
  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  // ✅ دالة إضافة الرصيد (محدثة)
  const handleAddBalance = async () => {
    // 1. طلب المبلغ من المستخدم
    const amount = prompt('أدخل قيمة الرصيد المراد إضافتها (دولار):');
    if (!amount) return;
    
    const value = parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) {
      alert('يرجى إدخال مبلغ صالح أكبر من صفر.');
      return;
    }

    // 2. التحقق من التوكن
    const token = localStorage.getItem('token');
    if (!token) {
      alert('يرجى تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }

    setIsLoading(true);

    try {
      // 3. إرسال طلب إلى الخادم
      const response = await axios.post(
        'http://localhost:5000/api/wallet/create-wallet-session',
        { amount: value },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📥 Response from server:', response.data);

      // 4. التوجيه إلى Stripe باستخدام الرابط
      if (response.data && response.data.url) {
        // ✅ الطريقة الجديدة - توجيه مباشر
        window.location.href = response.data.url;
      } else {
        // حالات الطوارئ: استخدام الـ ID لبناء الرابط
        if (response.data && response.data.id) {
          window.location.href = `https://checkout.stripe.com/pay/${response.data.id}`;
        } else {
          alert('حدث خطأ في إنشاء جلسة الدفع: لم يتم استلام رابط التوجيه.');
        }
      }

    } catch (error) {
      console.error('❌ فشل في فتح الدفع:', error);
      const errorMsg = error.response?.data?.error || error.message || 'حدث خطأ ما';
      alert(`❌ ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir='rtl' className='min-h-screen bg-slate-100 px-4 py-10 text-slate-900'>
      {/* ✅ عرض حالة التحديث */}
      {isUpdating && (
        <div className='mx-auto max-w-5xl mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded'>
          ⏳ جاري تحديث الرصيد...
        </div>
      )}
      <div className='mx-auto max-w-5xl space-y-8'>
        <div className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40'>
          <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
            <div className='flex items-center gap-4'>
              <div className='h-28 w-28 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100'>
                <img src={imageUrl} alt='الصورة الشخصية' className='h-full w-full object-cover' />
              </div>
              <div>
                <p className='text-sm text-slate-500'>مرحباً بك في حسابك</p>
                <h1 className='text-4xl font-semibold text-slate-950'>{user?.username || 'ضيف'}</h1>
                <p className='mt-2 inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-700'>
                  {user?.userType || 'زائر'}
                </p>
              </div>
            </div>
            <div className='flex flex-col gap-3'>
              <button
                onClick={handleEditProfile}
                className='inline-flex items-center justify-center rounded-3xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200'
              >
                تعديل الملف الشخصي
              </button>
              <div className='rounded-[28px] bg-cyan-500/10 p-5 text-right'>
                <p className='text-sm text-cyan-700'>رصيد المحفظة</p>
                <p className='mt-3 text-4xl font-semibold text-slate-950'>
                  {balance.toLocaleString('ar-EG')} ر.س
                </p>
                <button
                  onClick={handleAddBalance}
                  disabled={isLoading || isUpdating}
                  className={`mt-4 inline-flex rounded-3xl px-5 py-3 text-sm font-semibold text-white transition ${
                    (isLoading || isUpdating)
                      ? 'bg-cyan-400 cursor-not-allowed' 
                      : 'bg-cyan-600 hover:bg-cyan-700'
                  }`}
                >
                  {isLoading ? 'جاري المعالجة...' : isUpdating ? 'جاري التحديث...' : 'إضافة رصيد'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {user?.username ? (
          <div className='grid gap-6 lg:grid-cols-[1.5fr_1fr]'>
            <div className='rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40'>
              <h2 className='text-2xl font-semibold text-slate-950'>معلومات الحساب</h2>
              <div className='mt-8 space-y-5 text-slate-700'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='rounded-3xl bg-slate-50 p-5'>
                    <p className='text-sm text-slate-500'>البريد الإلكتروني</p>
                    <p className='mt-2 font-semibold text-slate-950'>{user.email || 'غير محدد'}</p>
                  </div>
                  <div className='rounded-3xl bg-slate-50 p-5'>
                    <p className='text-sm text-slate-500'>الهاتف</p>
                    <p className='mt-2 font-semibold text-slate-950'>{user.phone || 'غير محدد'}</p>
                  </div>
                </div>
                <div className='rounded-3xl bg-slate-50 p-5'>
                  <p className='text-sm text-slate-500'>العنوان</p>
                  <p className='mt-2 font-semibold text-slate-950'>{user.address || 'غير محدد'}</p>
                </div>
              </div>
            </div>

            <div className='rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40'>
              <h2 className='text-2xl font-semibold text-slate-950'>تفاصيل إضافية</h2>
              <div className='mt-8 space-y-4 text-slate-700'>
                <div className='flex items-center justify-between rounded-3xl bg-slate-50 p-5'>
                  <span className='text-sm text-slate-500'>معرف الحساب</span>
                  <span className='font-semibold text-slate-950'>{accountId}</span>
                </div>
                <div className='flex items-center justify-between rounded-3xl bg-slate-50 p-5'>
                  <span className='text-sm text-slate-500'>نوع المستخدم</span>
                  <span className='font-semibold text-slate-950'>{user.userType}</span>
                </div>
                <div className='flex items-center justify-between rounded-3xl bg-slate-50 p-5'>
                  <span className='text-sm text-slate-500'>العمر</span>
                  <span className='font-semibold text-slate-950'>{age}</span>
                </div>
                <div className='flex items-center justify-between rounded-3xl bg-slate-50 p-5'>
                  <span className='text-sm text-slate-500'>الجنس</span>
                  <span className='font-semibold text-slate-950'>{gender}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='rounded-[32px] border border-red-200 bg-red-50 p-8 text-red-700 shadow-xl shadow-red-100'>
            يرجى تسجيل الدخول لعرض تفاصيل الملف الشخصي والمحفظة.
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;