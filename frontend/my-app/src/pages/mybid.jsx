import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AdminTable from "./componant/AdminTable";
import DataFilters from "./componant/DataFilters";

const baseUrl = "http://localhost:5000";

export default function MyBids() {
  const [bids, setBids] = useState([]); // ستحتوي على مصفوفة products مع الحالة
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    bidType: "all",
  });

  // =============================================
  // ✅ جلب المزايدات التي شارك فيها المستخدم (مع الحالة)
  // =============================================
  useEffect(() => {
    const fetchMyBids = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("❌ يرجى تسجيل الدخول أولاً");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${baseUrl}/api/customers/my-bids`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ البيانات الجديدة تأتي في products
        setBids(response.data.products || []);
        setError("");
      } catch (err) {
        console.error("❌ Error fetching my bids:", err);
        setError(err.response?.data?.error || "فشل جلب المزايدات");
      } finally {
        setLoading(false);
      }
    };

    fetchMyBids();
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
    });
  };

  // =============================================
  // ✅ تصفية المزايدات (تستخدم product الجديد)
  // =============================================
  const filteredBids = useMemo(() => {
    return bids.filter((item) => {
      const search = filters.search?.toLowerCase() || "";
      const searchOk =
        !search ||
        item.product?.productName?.toLowerCase().includes(search) ||
        item.product?.category?.toLowerCase().includes(search);

      // bidType أصبحت جزءاً من product؟ لا، لكن في البيانات الجديدة لا يوجد bidType على مستوى المنتج،
      // لكن يمكننا إضافته إذا أردنا. بما أن الفلتر موجود، سنفترض أن كل المنتجات هي مزادات (أو يمكن إضافة bidType من product إذا وجد).
      // يمكننا تجاهل فلتر bidType أو نضيفه حسب الحاجة. سنبقي الفلتر لكننا لن نطبقه لأن البيانات الجديدة قد لا تحتوي على bidType.
      // لحل ذلك، يمكننا إزالة فلتر bidType أو تعديله.
      // سأبقي الفلتر لكن سأعتبر أن جميع المنتجات هي مزادات (نوع المزايدة = auction) لأن الـ API لا يعيد bidType.
      // أو يمكننا إضافة bidType إلى البيانات من الخادم. لكننا سنبقي الفلتر مع إلغاء تطبيقه مؤقتاً.
      // بدلاً من ذلك، سأزيل فلتر bidType من الفلاتر أو أجعله غير مؤثر.
      // لكن لتوافق مع الواجهة، سأترك الفلتر ولكن سأجعله يمرر الكل.
      // سأغير منطق التصفية ليتجاهل bidType مؤقتاً.
      const bidTypeOk = true; // أو نضبطه حسب الحاجة

      return searchOk && bidTypeOk;
    });
  }, [bids, filters]);

  // =============================================
  // ✅ تكوين الفلاتر (سنزيل bidType لأنه غير متوفر حالياً)
  // =============================================
  const filterConfig = [
    // يمكننا إضافة فلاتر أخرى مثل حالة المزايدة (ربح/خسارة/مستمر)
    {
      key: "status",
      label: "حالة المزايدة",
      type: "select",
      options: [
        { value: "all", label: "الكل" },
        { value: "ongoing_leading", label: "⏳ متصدر" },
        { value: "ongoing_outbid", label: "⚠️ خاسر مؤقتاً" },
        { value: "won", label: "🎉 ربحت" },
        { value: "lost", label: "😞 خسرت" },
      ],
    },
  ];

  // =============================================
  // ✅ أعمدة الجدول (معدلة للبيانات الجديدة)
  // =============================================
  const columns = [
    {
      header: "المنتج",
      accessor: "productName",
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
      accessor: "imageUrlproduct",
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
      header: "أعلى عرض لي",
      accessor: "myHighestBid",
      render: (item) => (
        <span className="font-semibold text-emerald-600">
          {Number(item.myHighestBid).toLocaleString("ar-EG")} ر.س
        </span>
      ),
    },
    {
      header: "أعلى عرض حالياً",
      accessor: "currentHighestBid",
      render: (item) => (
        <span className="font-semibold text-amber-600">
          {item.currentHighestBid > 0 ? Number(item.currentHighestBid).toLocaleString("ar-EG") : "لا يوجد"} ر.س
        </span>
      ),
    },
    {
      header: "حالة المزايدة",
      accessor: "status",
      render: (item) => {
        const statusMap = {
          ongoing_leading: { label: "⏳ متصدر", color: "bg-green-100 text-green-700" },
          ongoing_outbid: { label: "⚠️ خاسر مؤقتاً", color: "bg-yellow-100 text-yellow-700" },
          won: { label: "🎉 ربحت", color: "bg-blue-100 text-blue-700" },
          lost: { label: "😞 خسرت", color: "bg-red-100 text-red-700" },
        };
        const statusInfo = statusMap[item.status] || { label: item.status || "غير معروف", color: "bg-gray-100 text-gray-700" };
        return (
          <div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {item.message && <div className="text-xs text-slate-500 mt-1">{item.message}</div>}
          </div>
        );
      },
    },
    {
      header: "تاريخ الانتهاء",
      accessor: "auctionEndTime",
      render: (item) => {
        const endTime = item.product?.auctionEndTime;
        if (!endTime) return <span className="text-slate-400">-</span>;
        const date = new Date(endTime);
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
        <h2 className="text-3xl font-bold text-slate-950">المزايدات التي شاركت فيها</h2>
        <p className="text-xs text-slate-400">عدد المزايدات: {filteredBids.length}</p>
      </div>

      {/* الفلاتر */}
      <DataFilters
        activeSection="mybids"
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
          <p className="text-4xl mb-2">🏷️</p>
          <p>لم تشارك في أي مزايدة حتى الآن</p>
          <p className="text-sm text-slate-400 mt-2">شارك في المزايدات لعرضها هنا</p>
        </div>
      ) : (
        /* ✅ الجدول */
        <AdminTable
          data={filteredBids}
          columns={columns}
          filterColumns={{ bidType: "all" }} // غير مستخدم حالياً
          searchField="product.productName"
          itemName="المزايدات"
          pageSize={5}
          optionseting={false}
        />
      )}
    </div>
  );
}