import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import AdminTable from "./componant/AdminTable";
import DataFilters from "./componant/DataFilters";
import { Link, useNavigate } from "react-router-dom";

const baseUrl = "http://localhost:5000";

export default function DataReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [filters, setFilters] = useState({
    search: "",
    deliveryStatus: "all",
    bidType: "all",
    paid: "all",
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("يرجى تسجيل الدخول أولاً");
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${baseUrl}/admin/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReports(response.data.reports || []);
        setError("");
      } catch (err) {
        console.error("❌ Error fetching reports:", err);
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
    setFilters({
      search: "",
      deliveryStatus: "all",
      bidType: "all",
      paid: "all",
    });
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const search = filters.search?.toLowerCase() || "";
      const searchOk =
        !search ||
        r.productId?.productName?.toLowerCase().includes(search) ||
        r.sellerId?.username?.toLowerCase().includes(search) ||
        r.buyerId?.username?.toLowerCase().includes(search) ||
        r.deliveryId?.username?.toLowerCase().includes(search);
      
      const statusOk = filters.deliveryStatus === "all" || r.deliveryStatus === filters.deliveryStatus;
      const typeOk = filters.bidType === "all" || r.bidType === filters.bidType;
      const paidOk = filters.paid === "all" || String(r.paid) === filters.paid;
      
      return searchOk && statusOk && typeOk && paidOk;
    });
  }, [reports, filters]);

  const finalReports = useMemo(() => {
    return filteredReports.map((r) => ({
      ...r,
      productName: r.productId?.productName || 'غير معروف',
      productImage: r.productId?.imageUrlproduct,
      productCategory: r.productId?.category,
      sellerUsername: r.sellerId?.username || 'غير معروف',
      sellerEmail: r.sellerId?.email || '-',
      sellerPhone: r.sellerId?.phone || '-',
      buyerUsername: r.buyerId?.username || 'غير معروف',
      buyerEmail: r.buyerId?.email || '-',
      buyerPhone: r.buyerId?.phone || '-',
      deliveryUsername: r.deliveryId?.username || 'غير معروف',
      deliveryEmail: r.deliveryId?.email || '-',
      deliveryPhone: r.deliveryId?.phone || '-',
    }));
  }, [filteredReports]);

  const handleDelete = async (report) => {
    if (!report || !report._id) {
      alert("خطأ: معرف التقرير غير موجود");
      return;
    }

    const confirmDelete = window.confirm(
      `هل أنت متأكد من حذف التقرير الخاص بالمنتج "${report.productName || 'غير معروف'}"؟`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseUrl}/admin/reports/${report._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(prev => prev.filter(r => r._id !== report._id));
      alert(`✅ تم حذف التقرير بنجاح`);
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert(`❌ فشل حذف التقرير: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEdit = (report) => {
    if (!report || !report._id) {
      console.error('❌ Report ID is missing');
      alert('خطأ: معرف التقرير غير موجود');
      return;
    }

    console.log(`🔍 Navigating to edit report: ${report._id}`);
    navigate(`/datamaneg/edit-report/${report._id}`);
  };

  const filterConfig = [
    {
      key: 'deliveryStatus',
      label: 'حالة التوصيل',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'pending', label: '⏳ قيد الانتظار' },
        { value: 'in_transit', label: '🚚 في الطريق' },
        { value: 'delivered', label: '✅ تم التوصيل' },
        { value: 'cancelled', label: '❌ ملغي' },
      ]
    },
    {
      key: 'bidType',
      label: 'نوع البيع',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'fixed', label: '💰 سعر ثابت' },
        { value: 'auction', label: '🔨 مزاد' },
      ]
    },
    {
      key: 'paid',
      label: 'المدفوع',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'true', label: '✅ مدفوع' },
        { value: 'false', label: '❌ غير مدفوع' },
      ]
    },
  ];

  const columns = [
    {
      header: 'صورة المنتج',
      accessor: 'productImage',
      render: (item) => (
        item.productImage ? (
          <img
            src={item.productImage.startsWith('http') ? item.productImage : `${baseUrl}${item.productImage}`}
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
      header: 'الفئة',
      accessor: 'productCategory',
      render: (item) => {
        const categoryMap = {
          electronics: 'إلكترونيات',
          real_estate: 'عقارات',
          vehicles: 'مركبات',
          fashion: 'أزياء',
          furniture: 'أثاث',
          other: 'أخرى',
        };
        return (
          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
            {categoryMap[item.productCategory] || item.productCategory || '-'}
          </span>
        );
      },
    },
    {
      header: 'البائع',
      accessor: 'sellerUsername',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.sellerUsername}</div>
          <div className="text-xs text-slate-500">{item.sellerEmail}</div>
          <div className="text-xs text-slate-400">{item.sellerPhone}</div>
        </div>
      ),
    },
    {
      header: 'المشتري',
      accessor: 'buyerUsername',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.buyerUsername}</div>
          <div className="text-xs text-slate-500">{item.buyerEmail}</div>
          <div className="text-xs text-slate-400">{item.buyerPhone}</div>
        </div>
      ),
    },
    {
      header: 'المندوب',
      accessor: 'deliveryUsername',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.deliveryUsername}</div>
          <div className="text-xs text-slate-500">{item.deliveryEmail}</div>
          <div className="text-xs text-slate-400">{item.deliveryPhone}</div>
        </div>
      ),
    },
    {
      header: 'نوع البيع',
      accessor: 'bidType',
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.bidType === 'fixed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        }`}>
          {item.bidType === 'fixed' ? '💰 سعر ثابت' : '🔨 مزاد'}
        </span>
      ),
    },
    {
      header: 'حالة التوصيل',
      accessor: 'deliveryStatus',
      render: (item) => {
        const statusMap = {
          pending: { label: '⏳ قيد الانتظار', color: 'bg-yellow-100 text-yellow-700' },
          in_transit: { label: '🚚 في الطريق', color: 'bg-blue-100 text-blue-700' },
          delivered: { label: '✅ تم التوصيل', color: 'bg-green-100 text-green-700' },
          cancelled: { label: '❌ ملغي', color: 'bg-red-100 text-red-700' },
        };
        const status = statusMap[item.deliveryStatus] || { label: item.deliveryStatus, color: 'bg-gray-100 text-gray-700' };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>;
      },
    },
    {
      header: 'المدفوع',
      accessor: 'paid',
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {item.paid ? '✅ مدفوع' : '❌ غير مدفوع'}
        </span>
      ),
    },
    {
      header: 'تاريخ التقرير',
      accessor: 'createdAt',
      render: (item) => (
        <span className="text-sm text-slate-600">
          {item.createdAt ? new Date(item.createdAt).toLocaleString('ar-EG') : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">التقارير والطلبات</h2>
          <p className="text-xs text-slate-400">عدد التقارير: {finalReports.length}</p>
        </div>
        <Link
          to="/datamaneg/add-report"
          className="inline-flex items-center justify-center rounded-3xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 hover:shadow-lg shadow-md"
        >
          ➕ إضافة تقرير
        </Link>
      </div>

      <DataFilters
        activeSection="التقارير"
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
          <p>جارٍ تحميل التقارير...</p>
        </div>
      ) : finalReports.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500 shadow-sm mt-4">
          <p className="text-4xl mb-2">📋</p>
          <p>لا توجد تقارير لعرضها</p>
        </div>
      ) : (
        <AdminTable
          data={finalReports}
          columns={columns}
          filterColumns={{ deliveryStatus: 'all', bidType: 'all', paid: 'all' }}
          searchField="productName"
          itemName="التقارير"
          pageSize={5}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}