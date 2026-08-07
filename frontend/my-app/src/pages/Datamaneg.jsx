import { useNavigate, Outlet } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import ControlPanel from "./componant/controlpanel";
import DataCard from "./componant/DataCard";
import DataFilters from "./componant/DataFilters";
import AdminTable from "./componant/AdminTable";

const baseUrl = "http://localhost:5000";

const cards = [
  { label: 'المستخدمين', icon: '👥', path: '/datamaneg/users' },
  { label: 'المنتجات', icon: '📦', path: '/datamaneg/products' },
  { label: 'التقارير', icon: '📊', path: '/datamaneg/reports' },
  { label: 'الإعلانات', icon: '📣', path: '/datamaneg/ads' },
  { label: 'المزادات الحالية', icon: '🔨', path: '/datamaneg/bids' },
];

const WelcomeScreen = ({ onNavigate }) => (
  <div className="rounded-[32px] border border-slate-200 bg-white/95 p-10 shadow-xl shadow-slate-200/40">
    <div className="space-y-4 text-right">
      <h1 className="text-4xl font-bold text-slate-950">مرحبًا بك في لوحة الإدارة</h1>
      <p className="text-slate-600">يرجى اختيار قسم من القائمة الجانبية للبدء.</p>
    </div>

    <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <DataCard key={card.label} card={card} onClick={onNavigate} />
      ))}
    </div>
  </div>
);

// ===================== DATA USERS =====================
const DataUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ 
    search: "", 
    userType: "all", 
    gender: "all", 
    isVerified: "all" 
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "فشل جلب المستخدمين");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ search: "", userType: "all", gender: "all", isVerified: "all" });
  };

  const columns = [
    {
      header: "المستخدم",
      accessor: "username",
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.idImage && (
            <img
              src={item.idImage}
              alt="user"
              className="w-10 h-10 rounded-full object-cover border"
            />
          )}
          <span className="font-bold">{item.username}</span>
        </div>
      ),
    },
    { header: "الإيميل", accessor: "email" },
    { header: "النوع", accessor: "userType" },
    { header: "الهاتف", accessor: "phone" },
    {
      header: "توثيق",
      accessor: "isVerified",
      render: (item) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            item.isVerified
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isVerified ? "موثق" : "غير موثق"}
        </span>
      ),
    },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">المستخدمين</h2>
        </div>
      </div>

      {/* ✅ الفلاتر الخاصة بالمستخدمين */}
      <DataFilters
        activeSection="users"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {error ? (
        <div className="rounded-3xl bg-red-50 p-4 text-red-700 shadow-sm mt-4">{error}</div>
      ) : loading ? (
        <div className="rounded-3xl bg-slate-50 p-4 text-slate-700 shadow-sm mt-4">جارٍ تحميل المستخدمين...</div>
      ) : (
        <AdminTable
          data={users}
          columns={columns}
          filterColumns={{ userType: 'all', gender: 'all', isVerified: 'all' }}
          filterDefinitions={[
            { key: 'userType', label: 'نوع المستخدم', allLabel: 'الكل' },
            { key: 'gender', label: 'الجنس', allLabel: 'الكل' },
            { key: 'isVerified', label: 'التوثيق', allLabel: 'الكل', options: ['true', 'false'] },
          ]}
          searchField="username"
          itemName="المستخدمين"
          pageSize={5}
        />
      )}
    </div>
  );
};

// ===================== DATA PRODUCTS =====================
const DataProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ 
    search: "", 
    category: "all", 
    status: "all", 
    condition: "all" 
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseUrl}/admin/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(response.data.products || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "فشل جلب المنتجات");
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

  const columns = [
    { header: 'الصورة', accessor: 'imageUrlproduct' },
    { header: 'اسم المنتج', accessor: 'productName' },
    { header: 'الفئة', accessor: 'category' },
    { header: 'الحالة', accessor: 'status' },
    { header: 'نوع المنتج', accessor: 'condition' },
    { header: 'سعر البداية', accessor: 'startingPrice' },
    { header: 'السعر الثابت', accessor: 'fixedPrice' },
    {
      header: 'نهاية المزاد',
      accessor: 'auctionEndTime',
      render: (item) => item.auctionEndTime ? new Date(item.auctionEndTime).toLocaleString('ar-EG') : '-',
    },
    { header: 'التاجر', accessor: 'sellerId_username' },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">المنتجات</h2>
        </div>
      </div>

      {/* ✅ الفلاتر الخاصة بالمنتجات */}
      <DataFilters
        activeSection="products"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {error ? (
        <div className="rounded-3xl bg-red-50 p-4 text-red-700 shadow-sm mt-4">{error}</div>
      ) : loading ? (
        <div className="rounded-3xl bg-slate-50 p-4 text-slate-700 shadow-sm mt-4">جارٍ تحميل المنتجات...</div>
      ) : (
        <AdminTable
          data={products}
          columns={columns}
          filterColumns={{ category: 'all', status: 'all', condition: 'all' }}
          filterDefinitions={[
            { key: 'category', label: 'الفئة', allLabel: 'كل الفئات' },
            { key: 'status', label: 'الحالة', allLabel: 'كل الحالات' },
            { key: 'condition', label: 'نوع المنتج', allLabel: 'الكل' },
          ]}
          searchField="productName"
          itemName="المنتجات"
          pageSize={5}
        />
      )}
    </div>
  );
};

// ===================== DATA BIDS =====================
const DataBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ 
    search: "", 
    bidType: "all" 
  });

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseUrl}/admin/bids`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBids(response.data.bids || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "فشل جلب بيانات المزادات");
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

  const columns = [
    { header: 'صورة المنتج', accessor: 'ProductId_imageUrlproduct' },
    { header: 'اسم المنتج', accessor: 'ProductId_productName' },
    { header: 'المزايد', accessor: 'userId_username' },
    { header: 'نوع المزايدة', accessor: 'bidType' },
    { header: 'المبلغ', accessor: 'bidAmount' },
    {
      header: 'وقت العرض',
      accessor: 'bidTime',
      render: (item) => item.bidTime ? new Date(item.bidTime).toLocaleString('ar-EG') : '-',
    },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">المزادات</h2>
        </div>
      </div>

      {/* ✅ الفلاتر الخاصة بالمزادات */}
      <DataFilters
        activeSection="bids"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {error ? (
        <div className="rounded-3xl bg-red-50 p-4 text-red-700 shadow-sm mt-4">{error}</div>
      ) : loading ? (
        <div className="rounded-3xl bg-slate-50 p-4 text-slate-700 shadow-sm mt-4">جارٍ تحميل بيانات المزادات...</div>
      ) : (
        <AdminTable
          data={bids}
          columns={columns}
          filterColumns={{ bidType: 'all' }}
          filterDefinitions={[
            { key: 'bidType', label: 'نوع المزايدة', allLabel: 'الكل', options: ['fixed', 'auction'] },
          ]}
          searchField="ProductId_productName"
          itemName="المزادات"
          pageSize={5}
        />
      )}
    </div>
  );
};

// ===================== DATA REPORTS =====================
const DataReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ 
    search: "", 
    deliveryStatus: "all", 
    bidType: "all", 
    paid: "all" 
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseUrl}/admin/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReports(response.data.reports || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "فشل جلب التقارير");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ search: "", deliveryStatus: "all", bidType: "all", paid: "all" });
  };

  const columns = [
    { header: 'صورة المنتج', accessor: 'productId_imageUrlproduct' },
    { header: 'اسم المنتج', accessor: 'productId_productName' },
    { header: 'البائع', accessor: 'sellerId_username' },
    { header: 'المشتري', accessor: 'buyerId_username' },
    { header: 'المندوب', accessor: 'deliveryId_username' },
    { header: 'نوع البيع', accessor: 'bidType' },
    { header: 'حالة التوصيل', accessor: 'deliveryStatus' },
    {
      header: 'مدفوع',
      accessor: 'paid',
      render: (item) => item.paid ? 'نعم' : 'لا',
    },
    {
      header: 'تاريخ التقرير',
      accessor: 'createdAt',
      render: (item) => item.createdAt ? new Date(item.createdAt).toLocaleString('ar-EG') : '-',
    },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">التقارير</h2>
        </div>
      </div>

      {/* ✅ الفلاتر الخاصة بالتقارير */}
      <DataFilters
        activeSection="reports"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {error ? (
        <div className="rounded-3xl bg-red-50 p-4 text-red-700 shadow-sm mt-4">{error}</div>
      ) : loading ? (
        <div className="rounded-3xl bg-slate-50 p-4 text-slate-700 shadow-sm mt-4">جارٍ تحميل التقارير...</div>
      ) : (
        <AdminTable
          data={reports}
          columns={columns}
          filterColumns={{ deliveryStatus: 'all', bidType: 'all', paid: 'all' }}
          filterDefinitions={[
            { key: 'deliveryStatus', label: 'حالة التوصيل', allLabel: 'الكل', options: ['pending', 'delivered'] },
            { key: 'bidType', label: 'نوع البيع', allLabel: 'الكل', options: ['fixed', 'auction'] },
            { key: 'paid', label: 'المدفوع', allLabel: 'الكل', options: ['true', 'false'] },
          ]}
          searchField="productId_productName"
          itemName="التقارير"
          pageSize={5}
        />
      )}
    </div>
  );
};

// ===================== DATA ADS =====================
const DataAds = () => {
  const [filters, setFilters] = useState({ 
    search: "", 
    status: "all", 
    type: "all" 
  });

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ search: "", status: "all", type: "all" });
  };

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">الإعلانات</h2>
        </div>
      </div>

      {/* ✅ الفلاتر الخاصة بالإعلانات */}
      <DataFilters
        activeSection="ads"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500 mt-4">
        قريباً... إدارة الإعلانات
      </div>
    </div>
  );
};

// ===================== MAIN COMPONENT =====================
function Datamaneg() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const path = window.location.pathname;
    setCurrentPath(path);

    if (path.includes('/users')) {
      setActiveItem('/datamaneg/users');
    } else if (path.includes('/products')) {
      setActiveItem('/datamaneg/products');
    } else if (path.includes('/reports')) {
      setActiveItem('/datamaneg/reports');
    } else if (path.includes('/ads')) {
      setActiveItem('/datamaneg/ads');
    } else if (path.includes('/bids')) {
      setActiveItem('/datamaneg/bids');
    } else {
      setActiveItem('/datamaneg');
    }
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    setActiveItem(path);
    setCurrentPath(path);
  };

  return (
    <div dir="rtl" className="flex min-h-screen bg-slate-100 text-slate-900">
      <ControlPanel handleNavigation={handleNavigation} cards={cards} activeItem={activeItem} />

      <main className="order-1 flex-1 px-6 py-8">
      

        <section className="space-y-6">
          {currentPath === '/datamaneg' ? (
            <WelcomeScreen onNavigate={handleNavigation} />
          ) : (
            <Outlet />
          )}
        </section>
      </main>
    </div>
  );
}

export { DataUsers, DataProducts, DataReports, DataAds, DataBids };
export default Datamaneg;