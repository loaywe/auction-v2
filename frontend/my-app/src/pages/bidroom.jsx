import axios from 'axios';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from "react-redux";
import { useNavigate, useParams } from 'react-router-dom';

function Bid() {
  const user = useSelector((state) => state.users.users);
  const navigate = useNavigate();
  const { id } = useParams(); // id ثابت من الرابط

  // ============================================
  // 1. States
  // ============================================
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidHistory, setBidHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [highestBidder, setHighestBidder] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // ============================================
  // 2. Refs
  // ============================================
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isConnecting = useRef(false);
  const hasInitialized = useRef(false); // ✅ منع إعادة التهيئة
  const MAX_RECONNECT_ATTEMPTS = 5;

  // ============================================
  // 3. جلب بيانات المنتج (مرة واحدة)
  // ============================================
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setError('قم بالتسجيل');
          setTimeout(() => navigate('/Login'), 2000);
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/users/auction/${id}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const productData = response.data.product || response.data;
        setProduct(productData);
        setCurrentPrice(productData.currentPrice || productData.startingPrice || 0);
        setLoading(false);
      } catch (error) {
        console.error('❌ فشل في جلب المنتج:', error);
        const errorMsg = error.response?.data?.error || 'حدث خطأ ما';
        setError(errorMsg);
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [id, navigate]);

  // ============================================
  // 4. معالجة رسائل WebSocket (ثابتة)
  // ============================================
  const handleWebSocketMessage = useCallback((data) => {
    console.log('📩 رسالة WebSocket:', data.type);

    switch (data.type) {
      case 'init':
        console.log('📦 تهيئة المزاد:', data.product.productName);
        setProduct(data.product);
        setCurrentPrice(data.product.currentPrice || data.product.startingPrice || 0);

        if (data.bidders && data.bidders.length > 0) {
          setBidHistory(data.bidders.map(bid => ({
            bidder: bid.username || 'مستخدم',
            amount: bid.amount,
            image: bid.image || null,
            time: new Date().toLocaleTimeString('ar-EG')
          })));
          setHighestBidder(data.bidders[0]);
      

      
        } else {
          setBidHistory([]);
          setHighestBidder(null);
        }

        if (data.comments && data.comments.length > 0) {
          setComments(data.comments.map(comment => ({
            user: comment.user || 'مستخدم',
            message: comment.text,
            image: comment.image || null,
            time: new Date(comment.createdAt).toLocaleTimeString('ar-EG')




          })
        
        
        
        
        ));


        } else {
          setComments([]);
        }
        break;

      case 'newBid':
        const newBid = data.bidderis;
        if (newBid) {
          setCurrentPrice(newBid.amount);
          setBidHistory(prev => [
            {
              bidder: newBid.username || 'مستخدم',
              amount: newBid.amount,
              image: newBid.image || null,
              time: new Date().toLocaleTimeString('ar-EG')
            },
            ...prev
          ]);
          setHighestBidder(newBid);
        }
        setIsBidding(false);
        break;

      case 'newComment':
        if (data.comment) {
          setComments(prev => [
            {
              user: data.comment.user || 'مستخدم',
              message: data.comment.text,
              image: data.comment.image || null,
              time: new Date(data.comment.createAt).toLocaleTimeString('ar-EG')
            },
            ...prev
          ]);
        }
        break;

      case 'WELCOME':
        console.log('🎉', data.message);
        break;

      case 'error':
        if (data.message.includes('توكن') || data.errorType === 'auth') {
          localStorage.removeItem('token');
          alert('❌ جلسة منتهية، يرجى تسجيل الدخول مرة أخرى');
          navigate('/Login');
        } else {
          alert(`❌ ${data.message}`);
        }
        setIsBidding(false);
        break;

      case 'auctionEnd':
        alert(`🏁 انتهى المزاد! الفائز: ${data.winner} بالمبلغ: ${data.amount}`);
        break;

      default:
        console.log('📨 رسالة غير معروفة:', data);
    }
  }, [navigate]); // ✅ تعتمد فقط على navigate

  // ============================================
  // 5. اتصال WebSocket (يعتمد فقط على id و handleWebSocketMessage)
  // ============================================
  const connectWebSocket = useCallback(() => {
    // ✅ منع التهيئة المتكررة
    if (isConnecting.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    if (!id) return; // نحتاج فقط إلى id

    const token = localStorage.getItem("token");
    if (!token) {
      setError('قم بالتسجيل');
      setTimeout(() => navigate('/Login'), 2000);
      return;
    }

    isConnecting.current = true;

    try {
      const ws = new WebSocket(`ws://localhost:5000`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🟢 WebSocket متصل');
        setIsConnected(true);
        isConnecting.current = false;
        setReconnectAttempts(0);

        ws.send(JSON.stringify({
          type: 'join',
          token: token,
          productId: id // id من useParams
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ خطأ في معالجة الرسالة:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('🔴 خطأ في WebSocket:', error);
        setIsConnected(false);
        isConnecting.current = false;
      };

      ws.onclose = (event) => {
        console.log('🔴 WebSocket غير متصل:', event.code, event.reason);
        setIsConnected(false);
        isConnecting.current = false;

        // إعادة الاتصال التلقائي (إذا لم نصل للحد الأقصى)
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`🔄 محاولة إعادة الاتصال ${reconnectAttempts + 1} بعد ${delay/1000} ثانية...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, delay);
        } else {
          console.log('❌ فشل إعادة الاتصال بعد عدة محاولات');
          setError('تعذر الاتصال بالخادم. يرجى تحديث الصفحة.');
        }
      };

    } catch (error) {
      console.error('❌ خطأ في إنشاء WebSocket:', error);
      isConnecting.current = false;
    }
  }, [id, navigate, handleWebSocketMessage]); // ✅ إزالة product و reconnectAttempts

  // ============================================
  // 6. تشغيل WebSocket (مرة واحدة فقط)
  // ============================================
  useEffect(() => {
    // ✅ منع إعادة التهيئة
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    connectWebSocket();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      isConnecting.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // ✅ تشغيل مرة واحدة فقط

  // ============================================
  // 7. المؤقت التنازلي
  // ============================================
  useEffect(() => {
    if (!product?.auctionEndTime) return;

    const calculateTimeLeft = () => {
      const end = new Date(product.auctionEndTime).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      };
    };

    setTimeLeft(calculateTimeLeft());

    timerRef.current = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [product?.auctionEndTime]);

  // ============================================
  // 8. معالجة المزايدة
  // ============================================
  const handleBid = useCallback((e) => {
    e.preventDefault();

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('⚠️ المزاد غير متصل. جاري محاولة إعادة الاتصال...');
      connectWebSocket();
      return;
    }

    const amount = Number(bidAmount);
    if (!amount || amount <= currentPrice) {
      alert(`⚠️ يجب أن تكون قيمة المزايدة أكبر من ${currentPrice} ج.م`);
      return;
    }

    setIsBidding(true);

    wsRef.current.send(JSON.stringify({
      type: 'PLACE_BID',
      productId: id,
      amount: amount
    }));

    setBidAmount('');
  }, [bidAmount, currentPrice, id, connectWebSocket]);

  // ============================================
  // 9. معالجة التعليق
  // ============================================
  const handleComment = useCallback((e) => {
    e.preventDefault();

    if (!newComment.trim()) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('⚠️ المزاد غير متصل. حاول مرة أخرى.');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'ADD_COMMENT',
      productId: id,
      commentText: newComment.trim()
    }));

    setNewComment('');
  }, [newComment, id]);

  // ============================================
  // 10. دوال مساعدة
  // ============================================
  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price || 0);
  }, []);

  const isHighestBidder = useCallback(() => {
    if (!user || !highestBidder) return false;
    return highestBidder.username === user.username;
  }, [user, highestBidder]);

  const isAuctionActive = product?.status === 'active';

  // ============================================
  // 11. حالات التحميل والخطأ
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">جاري تحميل المزاد...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-2xl max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl text-red-600 mb-4 font-bold">{error}</h3>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl text-gray-700 font-bold">المنتج غير موجود</h3>
        </div>
      </div>
    );
  }

  // ============================================
  // 12. العرض الرئيسي
  // ============================================
  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">🏆 {product.productName || 'مزاد'}</h1>
              <p className="text-purple-200 text-sm mt-0.5">التفاصيل المنتج - عرض و المزايدة على هذا المنتج</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {isConnected ? '🟢 متصل' : '🔴 غير متصل'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isAuctionActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {isAuctionActive ? '🟢 نشط' : '🔴 منتهي'}
              </span>
            </div>
          </div>
        </div>

        {/* Three Columns Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* LEFT COLUMN - BID HISTORY */}
          <div className="md:col-span-3 order-2 md:order-1">
            <div className="bg-white rounded-2xl shadow-lg p-5 h-full">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">📊 سجل المزايدات</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {bidHistory.length > 0 ? (
                  bidHistory.map((bid, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        {bid.image && (
                          <img
    src={`http://localhost:5000${bid.image}`}
                            alt={bid.bidder}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="text-gray-700 text-sm font-medium">{bid.bidder}</span>
                      </div>
                      <span className="text-purple-600 font-bold text-sm">{formatPrice(bid.amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8 text-sm">لا توجد مزايدات</p>
                )}
              </div>
            </div>
          </div>

          {/* CENTER COLUMN - PRODUCT */}
          <div className="md:col-span-6 order-1 md:order-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Product Image */}
              <div className="bg-gray-100 h-64 flex items-center justify-center">
                {product.imageUrlproduct ? (
                  <img

                        src={`http://localhost:5000${product.imageUrlproduct}`}

                    alt={product.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl">📦</span>
                )}
              </div>

              {/* Product Details */}
              <div className="p-5">
                <h2 className="text-lg font-bold text-gray-800 mb-3">التفاصيل</h2>
                <div className="grid grid-cols-2 gap-2 text-gray-600 text-sm">
                  <p><span className="font-medium text-gray-700">الاسم:</span> {product.productName || 'اسم المنتج'}</p>
                  <p><span className="font-medium text-gray-700">التصنيف:</span> {product.category || 'غير محدد'}</p>
                  <p><span className="font-medium text-gray-700">الحالة:</span> {product.condition === 'new' ? 'جديد' : 'مستعمل'}</p>
                  <p><span className="font-medium text-gray-700">الكمية:</span> {product.quantity || 1}</p>
                  {product.description && (
                    <p className="col-span-2"><span className="font-medium text-gray-700">الوصف:</span> {product.description}</p>
                  )}
                </div>

                {/* Current Price & Timer */}
                <div className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white/70 text-sm">السعر الحالي</p>
                      <p className="text-2xl font-bold text-white">{formatPrice(currentPrice)}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-white/70 text-sm">الوقت المتبقي</p>
                      <p className="text-lg font-bold text-white">
                        {String(timeLeft.days).padStart(2, '0')}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bid Form */}
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-2">💰 أدخل قيمة المزايدة</h3>
                  <form onSubmit={handleBid} className="flex gap-2">
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`أدخل قيمة أكبر من ${currentPrice}`}
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                      min={currentPrice + 1}
                      step="1"
                      required
                      disabled={!isConnected || !isAuctionActive || isBidding}
                    />
                    <button
                      type="submit"
                      className={`px-6 py-2.5 rounded-lg text-white font-bold text-sm transition-all ${
                        isBidding || !isConnected || !isAuctionActive
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25'
                      }`}
                      disabled={isBidding || !isConnected || !isAuctionActive}
                    >
                      {isBidding ? '⏳ جاري...' : '🏷️ مزاد'}
                    </button>
                  </form>
                  {isHighestBidder() && isAuctionActive && (
                    <p className="text-center text-green-600 font-bold text-sm mt-2 animate-pulse">
                      🏆 أنت الأعلى مزايدة!
                    </p>
                  )}
                  {!isAuctionActive && (
                    <p className="text-center text-red-600 font-bold text-sm mt-2">⛔ انتهى المزاد</p>
                  )}
                  {!isConnected && (
                    <p className="text-center text-yellow-600 font-bold text-sm mt-2">⏳ جاري إعادة الاتصال...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - COMMENTS */}
          <div className="md:col-span-3 order-3">
            <div className="bg-white rounded-2xl shadow-lg p-5 h-full">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">💬 التعليقات</h2>

              {/* Comments List */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto mb-4">
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        {comment.image && (
                          <img
                                src={`http://localhost:5000${comment.image}`}

                            alt={comment.user}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="font-semibold text-gray-700 text-sm">{comment.user}</span>
                        <span className="text-xs text-gray-400 mr-auto">{comment.time}</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1 mr-8">{comment.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8 text-sm">لا توجد تعليقات</p>
                )}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="اكتب تعليق..."
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg text-sm hover:bg-blue-600 transition-all disabled:opacity-50"
                  disabled={!isConnected || !newComment.trim()}
                >
                  إرسال
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Bid;