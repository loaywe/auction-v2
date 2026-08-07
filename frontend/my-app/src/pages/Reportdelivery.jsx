import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AdminTable from "./componant/AdminTable";
import DataFilters from "./componant/DataFilters";

const baseUrl = "http://localhost:5000";

export default function Reportdelivery() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);

  // =============================================
  // ✅ جلب الطلبات الموكلة للمندوب
  // =============================================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("❌ يرجى تسجيل الدخول أولاً");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${baseUrl}/api/delivery/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(response.data.orders || []);
      setError("");
    } catch (err) {
      console.error("❌ خطأ في جلب الطلبات:", err);
      setError(err.response?.data?.message || "فشل جلب الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // =============================================
  // ✅ تحديث حالة التوصيل إلى "تم التوصيل"
  // =============================================
  const handleDeliver = async (orderId) => {
    try {
      setUpdating(orderId);
      const token = localStorage.getItem("token");

      const response = await axios.patch(
        `${baseUrl}/api/delivery/orders/${orderId}/deliver`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("✅ تم تأكيد التوصيل بنجاح");
        // تحديث القائمة محلياً
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId
              ? { ...order, deliveryStatus: "delivered" }
              : order
          )
        );
      }
    } catch (err) {
      console.error("❌ خطأ في تأكيد التوصيل:", err);
      alert(err.response?.data?.message || "❌ فشل تأكيد التوصيل");
    } finally {
      setUpdating(null);
    }
  };

  // =============================================
  // ✅ تكوين الفلاتر
  // =============================================
  const [filters, setFilters] = useState({
    search: "",
    deliveryStatus: "all",
  });

  const handleFiltersChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ search: "", deliveryStatus: "all" });
  };

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
  ];

  // =============================================
  // ✅ تصفية البيانات (لتمريرها إلى AdminTable)
  // =============================================
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const search = filters.search?.toLowerCase() || "";
      const searchOk =
        !search ||
        order.productId?.productName?.toLowerCase().includes(search) ||
        order.buyerId?.username?.toLowerCase().includes(search);

      const deliveryStatusOk =
        filters.deliveryStatus === "all" ||
        order.deliveryStatus === filters.deliveryStatus;

      return searchOk && deliveryStatusOk;
    });
  }, [orders, filters]);

  // =============================================
  // ✅ تعريف أعمدة الجدول
  // =============================================
  const columns = [
    {
      header: "المنتج",
      accessor: "productId_productName",
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">
            {item.productId?.productName || "-"}
          </div>
          {item.productId?.category && (
            <div className="text-xs text-slate-500">
              {item.productId.category}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "المشتري",
      accessor: "buyerId_username",
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">
            {item.buyerId?.username || "-"}
          </div>
          <div className="text-xs text-slate-400">
            {item.buyerId?.phone || ""}
          </div>
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
      header: "الإجراء",
      accessor: "actions",
      render: (item) => {
        if (item.deliveryStatus === "delivered") {
          return <span className="text-sm text-slate-400">تم التسليم</span>;
        }
        return (
          <button
            onClick={() => handleDeliver(item._id)}
            disabled={updating === item._id}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-medium transition"
          >
            {updating === item._id ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                جارٍ...
              </span>
            ) : (
              "🚚 تأكيد التوصيل"
            )}
          </button>
        );
      },
    },
  ];

  // =============================================
  // ✅ العرض الرئيسي
  // =============================================
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-950">طلبات التوصيل</h2>
        <p className="text-xs text-slate-400">
          عدد الطلبات الموكلة إليك: {filteredOrders.length}
        </p>
      </div>

      {/* الفلاتر */}
      <DataFilters
        activeSection="delivery"
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
          <p className="text-4xl mb-2">📦</p>
          <p>لا توجد طلبات موكلة إليك حالياً</p>
          <p className="text-sm text-slate-400 mt-2">
            ستظهر الطلبات هنا عند تعيينك كمنوب توصيل
          </p>
        </div>
      ) : (
        /* ✅ الجدول المتقدم */
        <AdminTable
          data={filteredOrders}
          columns={columns}
          filterColumns={{ deliveryStatus: filters.deliveryStatus }}
          searchField="productId_productName"
          itemName="الطلبات"
          pageSize={5}
          optionseting={false} // إخفاء أزرار التعديل والحذف لأنها ليست مناسبة هنا
        />
      )}
    </div>
  );
}