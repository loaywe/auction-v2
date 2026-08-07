import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import ControlPanel from "./componant/ControlPanel";
import DataCard from "./componant/DataCard";
import DataFilters from "./componant/DataFilters";
import AdminTable from "./componant/AdminTable";
import { Link } from "react-router-dom";

// ✅ استيراد مكونات العميل
import MyBids from "./mybid";
import MyPurchases from "./MyPurchases";

const baseUrl = "http://localhost:5000";

// =============================================
// ✅ بطاقات التاجر (القائمة الجانبية) - تحتوي على جميع الأقسام
// =============================================
const merchantCards = [
  { label: 'منتجاتي', icon: '📦', path: '/my-products/products' },
  { label: 'المزايدات (على منتجاتي)', icon: '🔨', path: '/my-products/bids' },
  { label: 'المبيعات', icon: '📊', path: '/my-products/orders' },
  { label: 'مزاداتي (التي شاركت فيها)', icon: '🏷️', path: '/my-products/my-bids' },
  { label: 'مشترياتي', icon: '🛍️', path: '/my-products/my-purchases' },
];

// ✅ بطاقات العميل (القائمة الجانبية)
const customerCards = [
  { label: 'مزاداتي', icon: '🏷️', path: '/my-products/my-bids' },
  { label: 'مشترياتي', icon: '🛍️', path: '/my-products/my-purchases' },
];

// =============================================
// ✅ شاشة الترحيب (ديناميكية حسب نوع المستخدم)
// =============================================
const WelcomeScreen = ({ onNavigate, userType }) => {
  const cards = userType === 'merchant' ? merchantCards : customerCards;
  
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-10 shadow-xl shadow-slate-200/40">
      <div className="space-y-4 text-right">
        <h1 className="text-4xl font-bold text-slate-950">
          {userType === 'merchant' ? 'مرحبًا بك في لوحة التاجر' : 'مرحبًا بك في حسابك'}
        </h1>
        <p className="text-slate-600">
          {userType === 'merchant'
            ? 'اختر قسمًا من القائمة الجانبية لإدارة منتجاتك ومتابعة المزايدات والمبيعات، بالإضافة إلى متابعة مزاداتك ومشترياتك الشخصية.'
            : 'اختر قسمًا من القائمة الجانبية لمتابعة مزاداتك ومشترياتك.'}
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <DataCard key={card.label} card={card} onClick={onNavigate} />
        ))}
      </div>
    </div>
  );
};

// =============================================
// ✅ 1. منتجات التاجر (موجودة)
// =============================================
const MerchantProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    status: "all",
    condition: "all",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseUrl}/merchant/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(response.data.products || []);
      } catch (err) {
        setError(err.response?.data?.error || "فشل جلب المنتجات");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ search: "", category: "all", status: "all", condition: "all" });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const search = filters.search?.toLowerCase() || "";
      const searchOk = !search || p.productName?.toLowerCase().includes(search);
      const categoryOk = filters.category === "all" || p.category === filters.category;
      const statusOk = filters.status === "all" || p.status === filters.status;
      const conditionOk = filters.condition === "all" || p.condition === filters.condition;
      return searchOk && categoryOk && statusOk && conditionOk;
    });
  }, [products, filters]);

  const handleDelete = async (product) => {
    if (!window.confirm(`هل أنت متأكد من حذف المنتج "${product.productName}"؟`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseUrl}/merchant/products/${product._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(prev => prev.filter(p => p._id !== product._id));
      alert("✅ تم حذف المنتج بنجاح");
    } catch (err) {
      alert(`❌ فشل الحذف: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEdit = (product) => {
    navigate(`/my-products/edit-product/${product._id}`);
  };

  const filterConfig = [
    {
      key: 'category',
      label: 'الفئة',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'إلكترونيات', label: 'إلكترونيات' },
        { value: 'العقارات', label: 'عقارات' },
        { value: 'مركبات', label: 'مركبات' },
        { value: 'أزياء', label: 'أزياء' },
        { value: 'أثاث', label: 'أثاث' },
        { value: 'اخرى', label: 'أخرى' },
      ]
    },
    {
      key: 'status',
      label: 'الحالة',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'active', label: '🟢 مزايدة' },
        { value: 'sold', label: '🟢 سعر ثابت' },
        { value: 'expired', label: '🔴 منتهي' },
      ]
    },
    {
      key: 'condition',
      label: 'حالة المنتج',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'new', label: 'جديد' },
        { value: 'used', label: 'مستعمل' },
      ]
    },
  ];

  const columns = [
    {
      header: 'الصورة',
      accessor: 'imageUrlproduct',
      render: (item) => (
        item.imageUrlproduct ? (
          <img
            src={item.imageUrlproduct.startsWith('http') ? item.imageUrlproduct : `${baseUrl}${item.imageUrlproduct}`}
            alt={item.productName}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200"
            onError={(e) => { e.target.onerror = null; e.target.src = '/default-product.png'; }}
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">📷</div>
        )
      ),
    },
    { header: 'اسم المنتج', accessor: 'productName' },
    { header: 'الفئة', accessor: 'category' },
    {
      header: 'الحالة',
      accessor: 'status',
      render: (item) => {
        const statusMap = {
          active: { label: '🟢 مزايدة', color: 'bg-green-100 text-green-700' },
          sold: { label: '🟢 سعر ثابت', color: 'bg-blue-100 text-blue-700' },
          expired: { label: '🔴 منتهي', color: 'bg-red-100 text-red-700' },
        };
        const status = statusMap[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-700' };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>;
      },
    },
    {
      header: 'السعر الثابت',
      accessor: 'fixedPrice',
      render: (item) => item.fixedPrice ? `${Number(item.fixedPrice).toLocaleString('ar-EG')} ر.س` : '-',
    },
    {
      header: 'الكمية',
      accessor: 'quantity',
      render: (item) => item.quantity || 1,
    },
    {
      header: 'التقييم',
      accessor: 'rating',
      render: (item) => item.rating || '-',
    },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">منتجاتي</h2>
          <p className="text-xs text-slate-400">عدد المنتجات: {filteredProducts.length}</p>
        </div>
        <Link
          to="/my-products/add-product"
          className="inline-flex items-center justify-center rounded-3xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 hover:shadow-lg shadow-md"
        >
          ➕ إضافة منتج
        </Link>
      </div>

      <DataFilters
        activeSection="products"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        filterConfig={filterConfig}
      />

      {error ? (
        <div className="rounded-3xl bg-red-50 p-4 text-red-700 shadow-sm mt-4 border border-red-200">❌ {error}</div>
      ) : loading ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-700 shadow-sm mt-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mx-auto mb-3"></div>
          <p>جارٍ تحميل المنتجات...</p>
        </div>
      ) : (
        <AdminTable
          data={filteredProducts}
          columns={columns}
          filterColumns={{ category: 'all', status: 'all', condition: 'all' }}
          searchField="productName"
          itemName="المنتجات"
          pageSize={5}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

// =============================================
// ✅ 2. المزايدات على منتجات التاجر (موجودة)
// =============================================
const MerchantBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ search: "", bidType: "all" });

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseUrl}/merchant/bids`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBids(response.data.bids || []);
      } catch (err) {
        setError(err.response?.data?.error || "فشل جلب المزايدات");
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ search: "", bidType: "all" });
  };

  const filteredBids = useMemo(() => {
    return bids.filter((b) => {
      const search = filters.search?.toLowerCase() || "";
      const searchOk = !search || b.ProductId?.productName?.toLowerCase().includes(search);
      const bidTypeOk = filters.bidType === "all" || b.bidType === filters.bidType;
      return searchOk && bidTypeOk;
    });
  }, [bids, filters]);

  const filterConfig = [
    {
      key: 'bidType',
      label: 'نوع المزايدة',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'fixed', label: 'سعر ثابت' },
        { value: 'auction', label: 'مزاد' },
      ]
    },
  ];

  const columns = [
    {
      header: 'المنتج',
      accessor: 'ProductId_productName',
      render: (item) => (
        <div>
          <div className="font-semibold">{item.ProductId?.productName || '-'}</div>
          {item.ProductId?.category && <div className="text-xs text-slate-500">{item.ProductId.category}</div>}
        </div>
      ),
    },
    {
      header: 'المزايد',
      accessor: 'userId_username',
      render: (item) => item.userId?.username || '-',
    },
    {
      header: 'المبلغ',
      accessor: 'bidAmount',
      render: (item) => `${Number(item.bidAmount).toLocaleString('ar-EG')} ر.س`,
    },
    {
      header: 'النوع',
      accessor: 'bidType',
      render: (item) => item.bidType === 'fixed' ? 'سعر ثابت' : 'مزاد',
    },
    {
      header: 'التاريخ',
      accessor: 'bidTime',
      render: (item) => item.bidTime ? new Date(item.bidTime).toLocaleString('ar-EG') : '-',
    },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-950">المزايدات على منتجاتي</h2>
        <p className="text-xs text-slate-400">عدد المزايدات: {filteredBids.length}</p>
      </div>

      <DataFilters
        activeSection="bids"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        filterConfig={filterConfig}
      />

      {error ? (
        <div className="rounded-3xl bg-red-50 p-4 text-red-700 shadow-sm mt-4">❌ {error}</div>
      ) : loading ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-700 shadow-sm mt-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mx-auto mb-3"></div>
          <p>جارٍ تحميل المزايدات...</p>
        </div>
      ) : (
        <AdminTable
          data={filteredBids}
          columns={columns}
          filterColumns={{ bidType: 'all' }}
          searchField="ProductId_productName"
          itemName="المزايدات"
          pageSize={5}
        />
      )}
    </div>
  );
};

// =============================================
// ✅ 3. المبيعات (الطلبات على منتجات التاجر) (موجودة)
// =============================================
const MerchantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ search: "", deliveryStatus: "all" });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseUrl}/merchant/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data.orders || []);
      } catch (err) {
        setError(err.response?.data?.error || "فشل جلب الطلبات");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ search: "", deliveryStatus: "all" });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const search = filters.search?.toLowerCase() || "";
      const searchOk = !search || o.productId?.productName?.toLowerCase().includes(search);
      const statusOk = filters.deliveryStatus === "all" || o.deliveryStatus === filters.deliveryStatus;
      return searchOk && statusOk;
    });
  }, [orders, filters]);

  const filterConfig = [
    {
      key: 'deliveryStatus',
      label: 'حالة التوصيل',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'pending', label: 'قيد الانتظار' },
        { value: 'delivered', label: 'تم التوصيل' },
      ]
    },
  ];

  const columns = [
    {
      header: 'المنتج',
      accessor: 'productId_productName',
      render: (item) => item.productId?.productName || '-',
    },
    {
      header: 'المبلغ',
      accessor: 'bidId_bidAmount',
      render: (item) => item.bidId ? `${Number(item.bidId.bidAmount).toLocaleString('ar-EG')} ر.س` : '-',
    },
    {
      header: 'نوع البيع',
      accessor: 'bidId_bidType',
      render: (item) => item.bidId?.bidType === 'fixed' ? 'سعر ثابت' : 'مزاد',
    },
    {
      header: 'المندوب',
      accessor: 'deliveryId_username',
      render: (item) => item.deliveryId?.username || 'لم يُحدد بعد',
    },
    {
      header: 'حالة التوصيل',
      accessor: 'deliveryStatus',
      render: (item) => {
        const statusMap = {
          pending: { label: '⏳ قيد الانتظار', color: 'bg-yellow-100 text-yellow-700' },
          delivered: { label: '✅ تم التوصيل', color: 'bg-green-100 text-green-700' },
        };
        const status = statusMap[item.deliveryStatus] || { label: item.deliveryStatus, color: 'bg-gray-100 text-gray-700' };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>;
      },
    },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-950">المبيعات</h2>
        <p className="text-xs text-slate-400">عدد الطلبات: {filteredOrders.length}</p>
      </div>

      <DataFilters
        activeSection="orders"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        filterConfig={filterConfig}
      />

      {error ? (
        <div className="rounded-3xl bg-red-50 p-4 text-red-700 shadow-sm mt-4">❌ {error}</div>
      ) : loading ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-700 shadow-sm mt-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mx-auto mb-3"></div>
          <p>جارٍ تحميل الطلبات...</p>
        </div>
      ) : (
        <AdminTable
          data={filteredOrders}
          columns={columns}
          filterColumns={{ deliveryStatus: 'all' }}
          searchField="productId_productName"
          itemName="الطلبات"
          pageSize={5}
        />
      )}
    </div>
  );
};

// =============================================
// ✅ المكون الرئيسي (Myprodect) - يدعم التاجر والعميل
// =============================================
function Myprodect() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(null);
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ جلب نوع المستخدم من التوكن
  useEffect(() => {
    const getUserType = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        // فك تشفير التوكن (بدون التحقق من الخادم)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        setUserType(decoded.userType || 'customer');
      } catch (err) {
        console.error("❌ Error decoding token:", err);
        setUserType('customer');
      } finally {
        setLoading(false);
      }
    };

    getUserType();
  }, []);

  // ✅ تحديد البطاقات المناسبة حسب نوع المستخدم
  const cards = userType === 'merchant' ? merchantCards : customerCards;

  // ✅ تحديث activeItem بناءً على المسار
  useEffect(() => {
    const path = location.pathname;
    setCurrentPath(path);

    if (userType === 'merchant') {
      if (path.includes('/products')) {
        setActiveItem('/my-products/products');
      } else if (path.includes('/bids')) {
        setActiveItem('/my-products/bids');
      } else if (path.includes('/orders')) {
        setActiveItem('/my-products/orders');
      } else if (path.includes('/my-bids')) {
        setActiveItem('/my-products/my-bids');
      } else if (path.includes('/my-purchases')) {
        setActiveItem('/my-products/my-purchases');
      } else {
        setActiveItem('/my-products');
      }
    } else {
      // عميل
      if (path.includes('/my-bids')) {
        setActiveItem('/my-products/my-bids');
      } else if (path.includes('/my-purchases')) {
        setActiveItem('/my-products/my-purchases');
      } else {
        setActiveItem('/my-products');
      }
    }
  }, [location, userType]);

  const handleNavigation = (path) => {
    navigate(path);
    setActiveItem(path);
    setCurrentPath(path);
  };

  // ✅ أثناء التحميل
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex min-h-screen bg-slate-100 text-slate-900">
      <ControlPanel 
        handleNavigation={handleNavigation} 
        cards={cards} 
        activeItem={activeItem} 
      />

      <main className="order-1 flex-1 px-6 py-8">
        <section className="space-y-6">
          {currentPath === '/my-products' ? (
            <WelcomeScreen onNavigate={handleNavigation} userType={userType} />
          ) : (
            <Outlet />
          )}
        </section>
      </main>
    </div>
  );
}

// ✅ تصدير جميع المكونات
export { MerchantProducts, MerchantBids, MerchantOrders };
export default Myprodect;