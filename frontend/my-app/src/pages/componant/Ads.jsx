import React, { useState, useEffect } from "react";

// ✅ دالة لتنسيق مسار الصور - إضافة /uploads/
const formatImageUrl = (path) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
};

function Ads({ items }) {
  const [currentItem, setCurrentItem] = useState(items[0]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * items.length);
      setCurrentItem(items[randomIndex]);
    }, 4000);

    return () => clearInterval(interval);
  }, [items]);

  // ✅ تنسيق مسار الصورة الحالية
  const imageUrl = currentItem?.imageUrl ? formatImageUrl(currentItem.imageUrl) : '/placeholder.png';

  return (
    <div
      dir="rtl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative mx-auto my-5 flex h-[clamp(200px,30vw,400px)]
        w-full max-w-[1200px]
        flex-col justify-end overflow-hidden
        rounded-xl bg-cover bg-center
        shadow-xl transition-all duration-300
        ${isHovered ? "scale-[1.01]" : "scale-100"}
      `}
      style={{
        backgroundImage: `linear-gradient(
          rgba(0,0,0,${isHovered ? 0.3 : 0.5}),
          rgba(0,0,0,${isHovered ? 0.3 : 0.5})
        ), url(${imageUrl})`,
      }}
    >
      <div className="w-full bg-gradient-to-t from-black/80 to-transparent p-[clamp(15px,3vw,30px)]">
        <p
          className={`
            m-0 text-center font-semibold text-white
            text-[clamp(16px,2vw,24px)]
            drop-shadow-lg
            transition-transform duration-300
            ${isHovered ? "-translate-y-1" : "translate-y-0"}
          `}
        >
          {currentItem?.title || 'لا يوجد وصف'}
        </p>
        
      </div>
    </div>
  );
}

export default Ads;