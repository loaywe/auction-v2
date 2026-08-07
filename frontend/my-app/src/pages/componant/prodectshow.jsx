import React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

// ✅ دالة لتنسيق مسار الصور - تدعم عدة صيغ
const formatImageUrl = (path) => {
  if (!path) return '/product-placeholder.png';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) return `http://localhost:5000${path}`;
  if (path.startsWith('uploads/')) return `http://localhost:5000/${path}`;
  return `http://localhost:5000/uploads/${path}`;
};

// ✅ مكون التقييم بالنجوم
const RatingStars = ({ rating, reviewCount }) => {
  const validRating = Math.min(Math.max(rating || 0, 0), 5);
  const fullStars = Math.floor(validRating);
  const hasHalfStar = validRating % 1 >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

  const renderStars = () => {
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="text-yellow-400 text-base">★</span>
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400 text-base">★</span>
      );
    }
    
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300 text-base">★</span>
      );
    }
    
    return stars;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {renderStars()}
      </div>
      <span className="text-sm font-medium text-slate-700">{validRating?.toFixed(1)}</span>
      {reviewCount > 0 && (
        <span className="text-xs text-slate-500">({reviewCount} تقييم)</span>
      )}
    </div>
  );
};

// ✅ مكون عرض السعر
const PriceDisplay = ({ fixedPrice, startingPrice, isAuction }) => {
  if (isAuction) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">السعر الحالي</span>
          <span className="text-xl font-bold text-green-600">
            {startingPrice?.toLocaleString()} ش.ك
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>⏰</span>
          <span>مزاد نشط</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">
          {fixedPrice?.toLocaleString()} ش.ك
        </span>
        {fixedPrice > 0 && (
          <span className="text-sm text-slate-500 line-through">
            {(fixedPrice * 1.2)?.toLocaleString()} ش.ك
          </span>
        )}
      </div>
      {fixedPrice > 0 && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <span>📈</span>
          <span>وفر 20%</span>
        </div>
      )}
    </div>
  );
};

// ✅ المكون الرئيسي
function ProductShow({ items }) {
  const {
    productName,
    description,
    imageUrlproduct,
    startingPrice,
    fixedPrice,
    category,
    condition,
    auctionEndTime,
    rating = 4.5,
    reviewCount = 0,
    isAuction = false,
    inStock = true,
    sellerName = 'بائع موثوق',
    isVerified = true,
    status,
    _id,
  } = items || {};

  // ✅ تنسيق مسار الصورة
  const imageUrl = formatImageUrl(imageUrlproduct);

  // ✅ التحقق من وجود صورة
  const hasImage = imageUrl && imageUrl !== '/product-placeholder.png';

  return (
    <div className="group     relative flex h-full w-full flex-col bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100">
      
      {/* ✅ شارة الحالة */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {!inStock && (
          <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
            نفذ من المخزون
          </span>
        )}
        {isAuction && (
          <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
            🔥 مزاد
          </span>
        )}
        {isVerified && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/90 text-white text-xs rounded-full shadow-lg backdrop-blur-sm">
            <span>✅</span>
            <span>موثوق</span>
          </div>
        )}
      </div>

      {/* ✅ صورة المنتج */}
      <div className="relative overflow-hidden bg-slate-100">
        {hasImage ? (
          <img
            src={imageUrl}
            alt={productName || 'منتج'}
            className="h-64 w-full object-cover transition duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/product-placeholder.png';
            }}
          />
        ) : (
          <div className="h-64 w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-6xl">📦</span>
          </div>
        )}
        
        {/* ✅ طبقة تأثير عند التمرير */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* ✅ أيقونة التصنيف */}
        {category && (
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium rounded-full shadow-lg">
              📂 {category}
            </span>
          </div>
        )}
      </div>

      {/* ✅ محتوى المنتج */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* ✅ اسم المنتج */}
        <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {productName || 'اسم المنتج'}
        </h3>

        {/* ✅ التقييم */}
        {rating !== undefined && rating !== null && (
          <div className="flex items-center justify-between">
            <RatingStars rating={rating} reviewCount={reviewCount} />
            <span className="text-xs text-slate-400">{condition || 'جديد'}</span>
          </div>
        )}

        {/* ✅ الوصف */}
        {description && (
          <p className="text-sm text-slate-600 line-clamp-2 flex-1">
            {description}
          </p>
        )}

        {/* ✅ السعر */}
        <div className="mt-2 pt-3 border-t border-slate-100">
          <PriceDisplay 
            fixedPrice={fixedPrice} 
            startingPrice={startingPrice}
            isAuction={isAuction}
          />
        </div>

        {/* ✅ معلومات البائع */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <div className="flex items-center gap-1">
          
          </div>
          {auctionEndTime && (
            <div className="flex items-center gap-1 text-orange-500">
              <span>⏰</span>
              <span>ينتهي: {new Date(auctionEndTime).toLocaleDateString('ar-SA')}</span>
            </div>
          )}
        </div>

        {/* ✅ زر الإجراء */}
        <Link to={`/${items.status}/${_id}`}>
          <button className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40">
            {isAuction ? '🔔 اشترك في المزاد' : '🛒 أضف إلى السلة'}
          </button>
        </Link>
      </div>
    </div>
  );
}

export default ProductShow;