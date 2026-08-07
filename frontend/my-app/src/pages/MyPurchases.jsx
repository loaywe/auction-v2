import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AdminTable from "./componant/AdminTable";
import DataFilters from "./componant/DataFilters";

const baseUrl = "http://localhost:5000";

export default function MyPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    deliveryStatus: "all",
    bidType: "all",
  });

  // =============================================
  // ✅ جلب المشتريات التي قام بها المستخدم
  // =============================================
  useEffect(() => {
    const fetchMyPurchases = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("❌ يرجى تسجيل الدخول أولاً");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${baseUrl}/api/customers/my-purchases`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setPurchases(response.data.purchases || []);
        setError("");
      } catch (err) {
        console.error("❌ Error fetching my purchases:", err);
        setError(err.response?.data?.error || "فشل جلب المشتريات");
      } finally {
        setLoading(false);
      }
    };

    fetchMyPurchases();
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
      deliveryStatus: "all",
      bidType: "all",
    });
  };

  // =============================================
  // ✅ تصفية المشتريات (تم تعديل البحث)
  // =============================================
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const search = filters.search?.toLowerCase() || "";
      const searchOk =
        !search ||
        p.product?.productName?.toLowerCase().includes(search) ||
        p.product?.category?.toLowerCase().includes(search) ||
        p.paymentMethod?.toLowerCase().includes(search) ||  // إضافة طريقة الدفع للبحث
        p.paymentStatus?.toLowerCase().includes(search);    // إضافة حالة الدفع للبحث

      const deliveryStatusOk =
        filters.deliveryStatus === "all" || p.deliveryStatus === filters.deliveryStatus;

      const bidTypeOk =
        filters.bidType === "all" || p.bid?.bidType === filters.bidType;

      return searchOk && deliveryStatusOk && bidTypeOk;
    });
  }, [purchases, filters]);

  // =============================================
  // ✅ تكوين الفلاتر (نفس الفلاتر السابقة)
  // =============================================
  const filterConfig = [
    {
      key: "deliveryStatus",
      label: "حالة التوصيل",
      type: "select",
      options: [
        { value: "all", label: "الكل" },
        { value: "pending", label: "⏳ قيد الانتظار" },
        { value: "delivered", label: "✅ تم التوصيل" },
      ],
    },
    {
      key: "bidType",
      label: "نوع المزايدة",
      type: "select",
      options: [
        { value: "all", label: "الكل" },
        { value: "auction", label: "🔨 مزاد" },
        { value: "fixed", label: "💰 سعر ثابت" },
      ],
    },
  ];

  // =============================================
  // ✅ أعمدة الجدول (تم حذف البائع وإضافة الدفع)
  // =============================================
  const columns = [
    {
      header: "المنتج",
      accessor: "product_productName",
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.product?.productName || "-"}</div>
          {item.product?.category && (
            <div className="text-xs text-slate-500">{item.product.category}</div>
          )}
        </div>
      ),
    },
    {
      header: "صورة المنتج",
      accessor: "product_imageUrlproduct",
      render: (item) =>
        item.product?.imageUrlproduct ? (
          <img
            src={
              item.product.imageUrlproduct.startsWith("http")
                ? item.product.imageUrlproduct
                : `${baseUrl}${item.product.imageUrlproduct}`
            }
            alt={item.product.productName}
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
      header: "المبلغ",
      accessor: "amount",
      render: (item) => (
        <span className="font-semibold text-emerald-600">
          {Number(item.amount || 0).toLocaleString("ar-EG")} ر.س
        </span>
      ),
    },
    {
      header: "نوع المزايدة",
      accessor: "bidType",
      render: (item) => {
        const typeMap = {
          auction: { label: "🔨 مزاد", color: "bg-purple-100 text-purple-700" },
          fixed: { label: "💰 سعر ثابت", color: "bg-blue-100 text-blue-700" },
        };
        const type = typeMap[item.bid?.bidType] || {
          label: item.bid?.bidType || "-",
          color: "bg-gray-100 text-gray-700",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.color}`}>
            {type.label}
          </span>
        );
      },
    },
    // ✅ عمود جديد: طريقة الدفع
    {
      header: "طريقة الدفع",
      accessor: "paymentMethod",
      render: (item) => {
        const methodMap = {
          cod: { label: "🚚 عند التوصيل", color: "bg-purple-100 text-purple-700" },
          card: { label: "💳 بطاقة", color: "bg-blue-100 text-blue-700" },
        };
        const method = methodMap[item.paymentMethod] || {
          label: item.paymentMethod || "-",
          color: "bg-gray-100 text-gray-700",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${method.color}`}>
            {method.label}
          </span>
        );
      },
    },
    // ✅ عمود جديد: حالة الدفع
    {
      header: "حالة الدفع",
      accessor: "paymentStatus",
      render: (item) => {
        const statusMap = {
          paid: { label: "✅ مدفوع", color: "bg-green-100 text-green-700" },
          pending: { label: "⏳ قيد الانتظار", color: "bg-yellow-100 text-yellow-700" },
        };
        const status = statusMap[item.paymentStatus] || {
          label: item.paymentStatus || "-",
          color: "bg-gray-100 text-gray-700",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      header: "المندوب",
      accessor: "delivery_username",
      render: (item) => {
        if (!item.delivery) return <span className="text-slate-400 text-sm">لم يُحدد</span>;
        return (
          <div>
            <div className="text-sm text-slate-700">{item.delivery.username}</div>
            <div className="text-xs text-slate-400">{item.delivery.phone || "-"}</div>
          </div>
        );
      },
    },
    {
      header: "حالة التوصيل",
      accessor: "deliveryStatus",
      render: (item) => {
        const statusMap = {
          pending: { label: "⏳ قيد الانتظار", color: "bg-yellow-100 text-yellow-700" },
          delivered: { label: "✅ تم التوصيل", color: "bg-green-100 text-green-700" },
        };
        const status = statusMap[item.deliveryStatus] || {
          label: item.deliveryStatus || "-",
          color: "bg-gray-100 text-gray-700",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      header: "تاريخ الشراء",
      accessor: "date",
      render: (item) => {
        const date = item.date ? new Date(item.date) : new Date();
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
        <h2 className="text-3xl font-bold text-slate-950">مشترياتي</h2>
        <p className="text-xs text-slate-400">عدد المشتريات: {filteredPurchases.length}</p>
      </div>

      {/* الفلاتر */}
      <DataFilters
        activeSection="mypurchases"
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
          <p>جارٍ تحميل المشتريات...</p>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500 shadow-sm mt-4">
          <p className="text-4xl mb-2">🛍️</p>
          <p>لم تقم بأي عملية شراء حتى الآن</p>
          <p className="text-sm text-slate-400 mt-2">ستظهر مشترياتك هنا عند شراء منتج</p>
        </div>
      ) : (
        /* ✅ الجدول */
        <AdminTable
          data={filteredPurchases}
          columns={columns}
          filterColumns={{ deliveryStatus: "all", bidType: "all" }}
          searchField="product_productName"
          itemName="المشتريات"
          pageSize={5}
          optionseting={false}
        />
      )}
    </div>
  );
}