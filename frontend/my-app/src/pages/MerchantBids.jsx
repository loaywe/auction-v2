import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AdminTable from "./componant/AdminTable";
import DataFilters from "./componant/DataFilters";

const baseUrl = "http://localhost:5000";

export default function MerchantBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // ✅ إضافة ProductId_category إلى الـ State
  const [filters, setFilters] = useState({
    search: "",
    bidType: "all",
    ProductId_category: "all",  // ✅ إضافة فلتر الفئة
  });

  // =============================================
  // ✅ جلب المزايدات على منتجات التاجر
  // =============================================
  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseUrl}/merchant/bids`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBids(response.data.bids || []);
        console.log("✅ Fetched bids:", response.data.bids);
        setError("");
      } catch (err) {
        console.error("❌ Error fetching bids:", err);
        setError(err.response?.data?.error || "فشل جلب المزايدات");
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, []);

  // =============================================
  // ✅ إدارة الفلاتر
  // =============================================
  const handleFiltersChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      bidType: "all",
      ProductId_category: "all",  // ✅ إعادة ضبط فلتر الفئة
    });
  };

  // =============================================
  // ✅ تصفية المزايدات - مع إضافة فلتر الفئة
  // =============================================
  const filteredBids = useMemo(() => {
    return bids.filter((b) => {
      const search = filters.search?.toLowerCase() || "";
      const searchOk =
        !search ||
        b.ProductId?.productName?.toLowerCase().includes(search) ||
        b.userId?.username?.toLowerCase().includes(search);

      const bidTypeOk = filters.bidType === "all" || b.bidType === filters.bidType;

      // ✅ إضافة فلتر الفئة (Category)
      const categoryOk = 
        filters.ProductId_category === "all" || 
        b.ProductId?.category === filters.ProductId_category;

      return searchOk && bidTypeOk && categoryOk;
    });
  }, [bids, filters]);

  // =============================================
  // ✅ تكوين الفلاتر - إزالة المسافة الزائدة من key
  // =============================================
  const filterConfig = [
    {
      key: 'ProductId_category',  
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
  ];

  // =============================================
  // ✅ أعمدة الجدول
  // =============================================
  const columns = [
    {
      header: "المنتج",
      accessor: "ProductId_productName",
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.ProductId?.productName || "-"}</div>
          {item.ProductId?.category && (
            <div className="text-xs text-slate-500">{item.ProductId.category}</div>
          )}
        </div>
      ),
    },
    {
      header: "صورة المنتج",
      accessor: "ProductId_imageUrlproduct",
      render: (item) =>
        item.ProductId?.imageUrlproduct ? (
          <img
            src={
              item.ProductId.imageUrlproduct.startsWith("http")
                ? item.ProductId.imageUrlproduct
                : `${baseUrl}${item.ProductId.imageUrlproduct}`
            }
            alt={item.ProductId.productName}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/default-product.png";
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
            📷
          </div>
        ),
    },
    {
      header: "المزايد",
      accessor: "userId_username",
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.userId?.username || "-"}</div>
          <div className="text-xs text-slate-500">{item.userId?.email || "-"}</div>
        </div>
      ),
    },
    {
      header: "المبلغ",
      accessor: "bidAmount",
      render: (item) => (
        <span className="font-semibold text-emerald-600">
          {Number(item.bidAmount).toLocaleString("ar-EG")} ر.س
        </span>
      ),
    },
 
    {
      header: "التاريخ",
      accessor: "bidTime",
      render: (item) => {
        if (!item.bidTime) return <span className="text-slate-400">-</span>;
        const date = new Date(item.bidTime);
        return (
          <div>
            <div className="text-sm text-slate-700">{date.toLocaleDateString("ar-EG")}</div>
            <div className="text-xs text-slate-400">{date.toLocaleTimeString("ar-EG")}</div>
          </div>
        );
      },
    },
  ];

  // =============================================
  // ✅ العرض
  // =============================================
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-950">المزايدات على منتجاتي</h2>
        <p className="text-xs text-slate-400">عدد المزايدات: {filteredBids.length}</p>
      </div>

      {/* الفلاتر */}
      <DataFilters
        activeSection="bids"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        filterConfig={filterConfig}
      />

      {/* حالة الخطأ أو التحميل */}
      {error ? (
        <div className="rounded-3xl bg-red-50 p-4 text-red-700 shadow-sm mt-4 border border-red-200">
          ❌ {error}
        </div>
      ) : loading ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-700 shadow-sm mt-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mx-auto mb-3"></div>
          <p>جارٍ تحميل المزايدات...</p>
        </div>
      ) : filteredBids.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500 shadow-sm mt-4">
          <p className="text-4xl mb-2">🔨</p>
          <p>لا توجد مزايدات على منتجاتك حتى الآن</p>
          <p className="text-sm text-slate-400 mt-2">سيظهر هنا عندما يزايد أحدهم على منتجاتك</p>
        </div>
      ) : (
        /* ✅ الجدول */
        <AdminTable
          data={filteredBids}
          columns={columns}
          filterColumns={{ ProductId_bidType: "all" }}
          searchField="ProductId_productName"
          itemName="المزايدات"
          pageSize={5}
          optionseting={false}
        />
      )}
    </div>
  );
}