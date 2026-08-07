import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AdminTable from "./componant/AdminTable";
import DataFilters from "./componant/DataFilters";

const baseUrl = "http://localhost:5000";

export default function MerchantOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    deliveryStatus: "all",
    paymentMethod: "all",
  });

  // =============================================
  // ✅ جلب طلبات منتجات التاجر
  // =============================================
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseUrl}/merchant/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data.orders || []);
        setError("");
      } catch (err) {
        console.error("❌ Error fetching orders:", err);
        setError(err.response?.data?.error || "فشل جلب الطلبات");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
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
      paymentMethod: "all",
    });
  };

  // =============================================
  // ✅ تصفية الطلبات
  // =============================================
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const search = filters.search?.toLowerCase() || "";
      const searchOk =
        !search ||
        o.productId?.productName?.toLowerCase().includes(search) ||
        o.buyerId?.username?.toLowerCase().includes(search);

      const deliveryStatusOk =
        filters.deliveryStatus === "all" || o.deliveryStatus === filters.deliveryStatus;
      
      const paymentMethodOk =
        filters.paymentMethod === "all" || o.paymentMethod === filters.paymentMethod;

      return searchOk && deliveryStatusOk && paymentMethodOk;
    });
  }, [orders, filters]);

  // =============================================
  // ✅ تكوين الفلاتر
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
      key: "paymentMethod",
      label: "طريقة الدفع",
      type: "select",
      options: [
        { value: "all", label: "الكل" },
        { value: "card", label: "💳 بطاقة ائتمان" },
        { value: "cod", label: "🚚 دفع عند التوصيل" },
      ],
    },
  ];

  // =============================================
  // ✅ أعمدة الجدول
  // =============================================
  const columns = [
    {
      header: "المنتج",
      accessor: "productId_productName",
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.productId?.productName || "-"}</div>
          {item.productId?.category && (
            <div className="text-xs text-slate-500">{item.productId.category}</div>
          )}
        </div>
      ),
    },
    {
      header: "صورة المنتج",
      accessor: "productId_imageUrlproduct",
      render: (item) =>
        item.productId?.imageUrlproduct ? (
          <img
            src={
              item.productId.imageUrlproduct.startsWith("http")
                ? item.productId.imageUrlproduct
                : `${baseUrl}${item.productId.imageUrlproduct}`
            }
            alt={item.productId.productName}
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
      header: "المشتري",
      accessor: "buyerId_username",
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.buyerId?.username || "-"}</div>
          <div className="text-xs text-slate-500">{item.buyerId?.email || "-"}</div>
          <div className="text-xs text-slate-400">{item.buyerId?.phone || "-"}</div>
        </div>
      ),
    },
    {
      header: "المبلغ",
      accessor: "amount",
      render: (item) => (
        <span className="font-semibold text-emerald-600">
          {Number(item.amount || item.bidId?.bidAmount || 0).toLocaleString("ar-EG")} ر.س
        </span>
      ),
    },
    {
      header: "الكمية",
      accessor: "quantity",
      render: (item) => item.quantity || 1,
    },
    {
      header: "طريقة الدفع",
      accessor: "paymentMethod",
      render: (item) => {
        const methodMap = {
          card: { label: "💳 بطاقة", color: "bg-blue-100 text-blue-700" },
          cod: { label: "🚚 عند التوصيل", color: "bg-purple-100 text-purple-700" },
        };
        const method = methodMap[item.paymentMethod] || {
          label: item.paymentMethod,
          color: "bg-gray-100 text-gray-700",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${method.color}`}>
            {method.label}
          </span>
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
          label: item.deliveryStatus,
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
      accessor: "deliveryId_username",
      render: (item) => {
        if (!item.deliveryId) return <span className="text-slate-400">لم يُحدد</span>;
        return (
          <div>
            <div className="text-sm text-slate-700">{item.deliveryId.username}</div>
            <div className="text-xs text-slate-400">{item.deliveryId.phone || "-"}</div>
          </div>
        );
      },
    },
    {
      header: "تاريخ الطلب",
      accessor: "date",
      render: (item) => {
        const date = item.date ? new Date(item.date) : new Date(item.createdAt);
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
        <h2 className="text-3xl font-bold text-slate-950">المبيعات</h2>
        <p className="text-xs text-slate-400">عدد الطلبات: {filteredOrders.length}</p>
      </div>

      {/* الفلاتر */}
      <DataFilters
        activeSection="orders"
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
          <p>جارٍ تحميل الطلبات...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500 shadow-sm mt-4">
          <p className="text-4xl mb-2">📊</p>
          <p>لا توجد طلبات حتى الآن</p>
          <p className="text-sm text-slate-400 mt-2">سيظهر هنا عندما يشتري أحدهم منتجاتك</p>
        </div>
      ) : (
        /* ✅ الجدول */
        <AdminTable
          data={filteredOrders}
          columns={columns}
          filterColumns={{ deliveryStatus: "all", paymentMethod: "all" }}
          searchField="productId_productName"
          itemName="الطلبات"
          pageSize={5}
                    optionseting={false}

        />
      )}
    </div>
  );
}