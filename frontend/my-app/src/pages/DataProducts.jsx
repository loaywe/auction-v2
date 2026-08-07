import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import AdminTable from "./componant/AdminTable";
import DataFilters from "./componant/DataFilters";
import { Link, useNavigate } from "react-router-dom";

const baseUrl = "http://localhost:5000";

export default function DataProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    status: "all",
    condition: "all",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("يرجى تسجيل الدخول أولاً");
          setLoading(false);
          return;
        }
        
        const [productsRes, bidsRes] = await Promise.all([
          axios.get(`${baseUrl}/admin/products`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${baseUrl}/admin/bids`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        
        setProducts(productsRes.data.products || []);
        setBids(bidsRes.data.bids || []);
        setError("");
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setError(err.response?.data?.error || err.message || "فشل جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      category: "all",
      status: "all",
      condition: "all",
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const search = filters.search?.toLowerCase() || "";
      const searchOk =
        !search ||
        p.productName?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search);
      
      const categoryOk = filters.category === "all" || p.category === filters.category;
      const statusOk = filters.status === "all" || p.status === filters.status;
      const conditionOk = filters.condition === "all" || p.condition === filters.condition;
      
      return searchOk && categoryOk && statusOk && conditionOk;
    });
  }, [products, filters]);

  const finalProducts = useMemo(() => {
    return filteredProducts.map((p) => {
      const productBids = bids.filter(b => b.ProductId === p._id);
      const highestBid = productBids.length > 0 
        ? Math.max(...productBids.map(b => Number(b.bidAmount))) 
        : Number(p.startingPrice);
      const bidCount = productBids.length;
      
      return {
        ...p,
        bidCount,
        highestBid,
        sellerUsername: p.sellerId?.username || 'غير معروف',
        sellerEmail: p.sellerId?.email || '-',
      };
    });
  }, [filteredProducts, bids]);

  const handleDelete = async (product) => {
    if (!product || !product._id) {
      alert("خطأ: معرف المنتج غير موجود");
      return;
    }

    const confirmDelete = window.confirm(
      `هل أنت متأكد من حذف المنتج "${product.productName}"؟`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseUrl}/admin/products/${product._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(prev => prev.filter(p => p._id !== product._id));
      alert(`✅ تم حذف المنتج "${product.productName}" بنجاح`);
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert(`❌ فشل حذف المنتج: ${err.response?.data?.error || err.message}`);
    }
  };

  // ✅ دالة التعديل الصحيحة
  const handleEdit = (product) => {
    if (!product) {
      console.error('❌ Product object is missing');
      alert('خطأ: بيانات المنتج غير موجودة');
      return;
    }

    if (!product._id) {
      console.error('❌ Product ID is missing:', product);
      alert('خطأ: معرف المنتج غير موجود');
      return;
    }

    console.log(`🔍 Navigating to edit product: ${product.productName} (${product._id})`);
    
    // ✅ الرابط الصحيح - يطابق الـ Route في main.jsx
    navigate(`/datamaneg/edit-product/${product._id}`);
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
        { value: 'sold', label: '🟢  سعر ثابت  ' },
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
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-product.png';
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
            📷
          </div>
        )
      ),
    },
    {
      header: 'اسم المنتج',
      accessor: 'productName',
      render: (item) => (
        <div className="font-semibold text-slate-800">{item.productName}</div>
      ),
    },
    {
      header: 'الوصف',
      accessor: 'description',
      render: (item) => (
        <div className="max-w-xs truncate text-sm text-slate-600" title={item.description}>
          {item.description || '-'}
        </div>
      ),
    },
    {
      header: 'الفئة',
      accessor: 'category',
      render: (item) => (
        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
          {item.category || '-'}
        </span>
      ),
    },
    {
      header: 'الحالة',
      accessor: 'status',
      render: (item) => {
        const statusMap = {
          active: { label: '🟢 مزايدة', color: 'bg-green-100 text-green-700' },
          sold: { label: '🔴 سعر ثابت ', color: 'bg-blue-100 text-blue-700' },
          expired: { label: '⏰ منتهي', color: 'bg-red-100 text-red-700' },
        };
        const status = statusMap[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-700' };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>;
      },
    },
    {
      header: 'الاستخدام',
      accessor: 'condition',
      render: (item) => {
        const conditionMap = {
          new: 'جديد',
          used: 'مستعمل',
        };
        return conditionMap[item.condition] || item.condition || '-';
      },
    },
    {
      header: 'سعر البداية',
      accessor: 'startingPrice',
      render: (item) => (
        <span className="font-semibold text-slate-700">
          {Number(item.startingPrice).toLocaleString('ar-EG')} ر.س
        </span>
      ),
    },
    {
      header: 'السعر الثابت',
      accessor: 'fixedPrice',
      render: (item) => (
        <span className={`font-semibold ${item.fixedPrice ? 'text-emerald-600' : 'text-slate-400'}`}>
          {item.fixedPrice ? Number(item.fixedPrice).toLocaleString('ar-EG') + ' ر.س' : '-'}
        </span>
      ),
    },
    
  
    {
      header: 'نهاية المزاد',
      accessor: 'auctionEndTime',
      render: (item) => {
        if (!item.auctionEndTime) return <span className="text-slate-400">-</span>;
        const endDate = new Date(item.auctionEndTime);
        const now = new Date();
        const isExpired = endDate < now;
        return (
          <span className={`text-sm ${isExpired ? 'text-red-600 font-medium' : 'text-slate-700'}`}>
            {endDate.toLocaleString('ar-EG')}
            {isExpired && ' ⏰'}
          </span>
        );
      },
    },
    {
      header: 'التاجر',
      accessor: 'sellerUsername',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.sellerUsername}</div>
          <div className="text-xs text-slate-500">{item.sellerEmail}</div>
        </div>
      ),
    },
    {
      header: 'التقييم',
      accessor: 'rating',
      render: (item) => (
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">⭐</span>
          <span className="font-semibold text-slate-700">{item.rating || '0'}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">المنتجات </h2>
          <p className="text-xs text-slate-400">عدد المنتجات: {finalProducts.length}</p>
        </div>
        <Link
          to="/datamaneg/add-product"
          className="inline-flex items-center justify-center rounded-3xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 hover:shadow-lg shadow-md"
        >
          ➕ إضافة منتج
        </Link>
      </div>

      <DataFilters
        activeSection="المنتجات"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        filterConfig={filterConfig}
      />

      {error ? (
        <div className="rounded-3xl bg-red-50 p-4 text-red-700 shadow-sm mt-4 border border-red-200">
          ❌ {error}
        </div>
      ) : loading ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-700 shadow-sm mt-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mx-auto mb-3"></div>
          <p>جارٍ تحميل المنتجات...</p>
        </div>
      ) : finalProducts.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500 shadow-sm mt-4">
          <p className="text-4xl mb-2">📦</p>
          <p>لا توجد منتجات لعرضها</p>
        </div>
      ) : (
        <AdminTable
          data={finalProducts}
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
}