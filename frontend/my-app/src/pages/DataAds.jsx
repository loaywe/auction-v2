import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import AdminTable from "./componant/AdminTable";
import DataFilters from "./componant/DataFilters";
import { Link, useNavigate } from "react-router-dom";

const baseUrl = "http://localhost:5000";

export default function DataAds() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
  });

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseUrl}/admin/ads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAds(response.data.ads || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "فشل جلب الإعلانات");
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "all",
    });
  };

  const filteredAds = useMemo(() => {
    return ads.filter((a) => {
      const search = filters.search?.toLowerCase() || "";
      const searchOk =
        !search ||
        a.title?.toLowerCase().includes(search) ||
        a.description?.toLowerCase().includes(search) ||
        a.userId?.username?.toLowerCase().includes(search);
      
      const statusOk = filters.status === "all" || a.status === filters.status;
      
      return searchOk && statusOk;
    });
  }, [ads, filters]);

  const finalAds = useMemo(() => {
    return filteredAds.map((a) => ({
      ...a,
      username: a.userId?.username || 'غير معروف',
      userEmail: a.userId?.email || '-',
    }));
  }, [filteredAds]);

  const handleDelete = async (ad) => {
    const confirmDelete = window.confirm(
      `هل أنت متأكد من حذف الإعلان "${ad.title}"؟`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseUrl}/admin/ads/${ad._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAds(prev => prev.filter(a => a._id !== ad._id));
      alert(`تم حذف الإعلان بنجاح`);
    } catch (err) {
      alert(`فشل حذف الإعلان: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEdit = (ad) => {
    if (!ad || !ad._id) {
      console.error('❌ Ad ID is missing');
      alert('خطأ: معرف الإعلان غير موجود');
      return;
    }

    console.log(`🔍 Navigating to edit ad: ${ad._id}`);
    navigate(`/datamaneg/edit-ad/${ad._id}`);
  };

  const filterConfig = [
    {
      key: 'status',
      label: 'الحالة',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'active', label: '🟢 نشط' },
        { value: 'expired', label: '🔴 منتهي' },
        { value: 'pending', label: '⏳ قيد الانتظار' },
      ]
    },
  ];

  const columns = [
    {
      header: 'الصورة',
      accessor: 'imageUrl',
      render: (item) => (
        item.imageUrl ? (
          <img
            src={item.imageUrl.startsWith('http') ? item.imageUrl : `${baseUrl}${item.imageUrl}`}
            alt={item.title}
            className="w-20 h-20 rounded-xl object-cover border border-slate-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-ad.png';
            }}
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
            📷
          </div>
        )
      ),
    },
    {
      header: 'العنوان',
      accessor: 'title',
      render: (item) => (
        <div className="font-semibold text-slate-800">{item.title}</div>
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
      header: 'الحالة',
      accessor: 'status',
      render: (item) => {
        const statusMap = {
          active: { label: '🟢 نشط', color: 'bg-green-100 text-green-700' },
          expired: { label: '🔴 منتهي', color: 'bg-red-100 text-red-700' },
          pending: { label: '⏳ قيد الانتظار', color: 'bg-yellow-100 text-yellow-700' },
        };
        const status = statusMap[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-700' };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>;
      },
    },
    {
      header: 'المستخدم',
      accessor: 'username',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.username}</div>
          <div className="text-xs text-slate-500">{item.userEmail}</div>
        </div>
      ),
    },
    // ✅ تم إزالة: نوع المستخدم (userType)
    // ✅ تم إزالة: تاريخ النشر (createdAt)
    // ✅ تم إزالة: الإجراءات (actions) - يتم التعامل معها عبر AdminTable
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">الإعلانات</h2>
          <p className="text-xs text-slate-400">عدد الإعلانات: {finalAds.length}</p>
        </div>
        <Link
          to="/datamaneg/add-ad"
          className="inline-flex items-center justify-center rounded-3xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 hover:shadow-lg shadow-md"
        >
          ➕ إضافة إعلان
        </Link>
      </div>

      <DataFilters
        activeSection="الإعلانات"
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
          <p>جارٍ تحميل الإعلانات...</p>
        </div>
      ) : finalAds.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500 shadow-sm mt-4">
          <p className="text-4xl mb-2">📢</p>
          <p>لا توجد إعلانات لعرضها</p>
        </div>
      ) : (
        <AdminTable
          data={finalAds}
          columns={columns}
          filterColumns={{ status: 'all' }}
          searchField="title"
          itemName="الإعلانات"
          pageSize={5}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}