// pages/FixedPriceProducts.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductComplex from "./prodectcomlex";
import DataFilters from "./DataFilters";

function FixedPriceProductsl({status} ) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    sortBy: 'newest',
    minPrice: '',
    maxPrice: '',
    inStock: 'all'
  });

  // تكوين الفلاتر
  const filterConfig = [
    {
      key: 'category',
      label: '📂 الفئة',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'إلكترونيات', label: '📱 إلكترونيات' },
        { value: 'العقارات', label: '🏠 عقارات' },
        { value: 'مركبات', label: '🚗 مركبات' },
        { value: 'أزياء', label: '👗 أزياء' },
        { value: 'أثاث', label: '🪑 أثاث' },
        { value: 'اخرى', label: '📦 أخرى' }
      ]
    },
    {
      key: 'sortBy',
      label: '📊 ترتيب حسب',
      type: 'select',
      options: [
        { value: 'price-low', label: '💰 السعر: من الأقل' },
        { value: 'price-high', label: '💰 السعر: من الأعلى' },
        { value: 'newest', label: '🆕 الأحدث' },
        { value: 'oldest', label: '📅 الأقدم' }
      ]
    },
    {
      key: 'inStock',
      label: '📦 المخزون',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'inStock', label: '✅ متوفر' },
        { value: 'outOfStock', label: '❌ غير متوفر' }
      ]
    }
  ];

  // ✅ جلب المنتجات باستخدام POST مع status في body
  const fetchFixedPriceProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // إضافة الفلاتر
      if (filters.search) params.append('search', filters.search);
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sortBy && filters.sortBy !== 'all') {
        params.append('sortBy', filters.sortBy);
      }

      // ✅ استخدام POST مع status في body
      const response = await axios.post(
        `http://localhost:5000/api/users/products/status`,
        { status: status }, // ✅ إرسال status في body
        { params: params }     // ✅ إرسال الفلاتر في query params
      );
      
      if (response.data.success) {
        // ✅ حفظ الإحصائيات من الـ API
        setStats(response.data.stats || {});
        
        let productsData = response.data.products.map(product => ({
          ...product,
          isAuction: false,
          inStock: (product.quantity || 0) > 0,
          isVerified: product.sellerId?.isVerified || false,
          sellerName: product.sellerId?.username || 'بائع',
          reviewCount: 0,
          quantity: product.quantity || 0,
          status: product.status || 'active'
        }));

        // تطبيق فلتر المخزون (إذا لم يتم تطبيقه من الـ API)
        if (filters.inStock && filters.inStock !== 'all') {
          if (filters.inStock === 'inStock') {
            productsData = productsData.filter(p => p.quantity > 0);
          } else if (filters.inStock === 'outOfStock') {
            productsData = productsData.filter(p => p.quantity === 0);
          }
        }

        setProducts(productsData);
      } else {
        setError(response.data.message || 'حدث خطأ أثناء جلب المنتجات');
      }
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء جلب المنتجات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixedPriceProducts();
  }, [filters.search, filters.category, filters.minPrice, filters.maxPrice, filters.sortBy, filters.inStock]);

  // معالج تغيير الفلاتر
  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // إعادة ضبط الفلاتر
  const handleReset = () => {
    setFilters({
      search: '',
      category: 'all',
      sortBy: 'newest',
      minPrice: '',
      maxPrice: '',
      inStock: 'all'
    });
  };

  // ✅ استخدام الإحصائيات من الـ API أو حسابها محلياً
  const displayStats = {
    total: stats.total || products.length,
    inStock: stats.inStock || products.filter(p => p.quantity > 0).length,
    outOfStock: stats.outOfStock || products.filter(p => p.quantity === 0).length,
    avgPrice: stats.avgPrice || (products.length > 0 
      ? Math.round(products.reduce((sum, p) => sum + (p.fixedPrice || 0), 0) / products.length)
      : 0),
    totalValue: stats.totalValue || 0
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button 
            onClick={fetchFixedPriceProducts}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* عنوان الصفحة */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🛍️ منتجات للبيع بسعر ثابت
          </h1>
          <p className="text-gray-600">
            اكتشف المنتجات المتاحة للشراء المباشر
          </p>
        </div>

        {/* ✅ إحصائيات سريعة محسنة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-700">{displayStats.total}</div>
            <div className="text-sm text-blue-600">إجمالي المنتجات</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-700">{displayStats.inStock}</div>
            <div className="text-sm text-green-600">✅ متوفر</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-red-700">{displayStats.outOfStock}</div>
            <div className="text-sm text-red-600">❌ غير متوفر</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-purple-700">{displayStats.avgPrice.toLocaleString()} ر.س</div>
            <div className="text-sm text-purple-600">💰 متوسط السعر</div>
          </div>
        </div>

        {/* ✅ إضافة قيمة إجمالية */}
        {displayStats.totalValue > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3 mb-4 text-center shadow-sm">
            <span className="text-sm text-amber-700">القيمة الإجمالية للمنتجات: </span>
            <span className="text-xl font-bold text-amber-800">{displayStats.totalValue.toLocaleString()} ر.س</span>
          </div>
        )}

        {/* شريط الفلاتر */}
        <DataFilters
          activeSection="fixed"
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleReset}
          filterConfig={filterConfig}
          showPriceRange={true}
        />

        {/* عدد المنتجات */}
        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            عدد المنتجات: <span className="font-bold text-blue-600">{products.length}</span>
          </span>
          {products.length > 0 && (
            <span className="text-xs text-gray-400">
              آخر تحديث: {new Date().toLocaleString('ar-SA')}
            </span>
          )}
        </div>

        {/* عرض المنتجات */}
        {products.length > 0 ? (
          <ProductComplex products={products} />
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl text-gray-500">
              لا توجد منتجات متاحة حالياً
            </p>
            <p className="text-gray-400 mt-2">
              {filters.search ? 'حاول تغيير كلمات البحث' : 'ترقب المنتجات الجديدة قريباً'}
            </p>
            {filters.inStock !== 'all' && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, inStock: 'all' }))}
                className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
              >
                ↺ إعادة ضبط فلتر المخزون
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FixedPriceProductsl;