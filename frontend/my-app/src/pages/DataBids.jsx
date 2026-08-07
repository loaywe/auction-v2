import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import AdminTable from "./componant/AdminTable";
import DataFilters from "./componant/DataFilters";

const baseUrl = "http://localhost:5000";

export default function DataBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [filters, setFilters] = useState({
    search: "",
    bidType: "all",
    productStatus: "all",
    minAmount: "",
    maxAmount: "",
    dateFrom: "",
    dateTo: ""
  });

  // ✅ جلب البيانات فقط
  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseUrl}/admin/bids`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBids(response.data.bids || []);
        setError("");
      } catch (err) {
        setError(err.response?.data?.error || "فشل جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, []);

  // ✅ معالجة الفلاتر
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      bidType: "all",
      productStatus: "all",
      minAmount: "",
      maxAmount: "",
      dateFrom: "",
      dateTo: ""
    });
  }, []);

  // ✅ تصفية المزايدات
  const filteredBids = useMemo(() => {
    return bids.filter((b) => {
      const search = filters.search?.toLowerCase() || "";
      
      const searchOk = !search ||
        b.userId?.username?.toLowerCase().includes(search) ||
        b.ProductId?.productName?.toLowerCase().includes(search) ||
        b.ProductId?.category?.toLowerCase().includes(search);
      
      const typeOk = filters.bidType === "all" || b.bidType === filters.bidType;
      
      const statusOk = filters.productStatus === "all" || 
        b.ProductId?.status === filters.productStatus;
      
      const amountOk = 
        (!filters.minAmount || b.bidAmount >= Number(filters.minAmount)) &&
        (!filters.maxAmount || b.bidAmount <= Number(filters.maxAmount));
      
      const dateOk = 
        (!filters.dateFrom || new Date(b.bidTime) >= new Date(filters.dateFrom)) &&
        (!filters.dateTo || new Date(b.bidTime) <= new Date(filters.dateTo));
      
      return searchOk && typeOk && statusOk && amountOk && dateOk;
    });
  }, [bids, filters]);

  // ✅ إعداد البيانات للجدول
  const finalBids = useMemo(() => {
    return filteredBids.map((b) => ({
      ...b,
      productName: b.ProductId?.productName || 'غير معروف',
      productImage: b.ProductId?.imageUrlproduct,
      productCategory: b.ProductId?.category,
      productStatus: b.ProductId?.status || 'unknown',
      bidderUsername: b.userId?.username || 'غير معروف',
      bidderEmail: b.userId?.email || '-',
      bidderType: b.userId?.userType || '-',
    }));
  }, [filteredBids]);

  // ✅ تكوين الفلاتر المبسطة
  const filterConfig = [
    {
      key: 'bidType',
      label: 'نوع المزايدة',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'fixed', label: '💰 سعر ثابت' },
        { value: 'auction', label: '🔥 مزاد' },
      ]
    },
    {
      key: 'productStatus',
      label: 'حالة المنتج',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'active', label: '🟢 نشط' },
        { value: 'sold', label: '✅ مباع' },
        { value: 'expired', label: '⏰ منتهي' },
      ]
    },

  ];

  // ✅ أعمدة الجدول الأساسية
  const columns = [
    {
      header: 'المنتج',
      accessor: 'productName',
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            {item.productImage ? (
              <img
                src={item.productImage.startsWith('http') ? item.productImage : `${baseUrl}${item.productImage}`}
                alt={item.productName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-product.png';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                📦
              </div>
            )}
            <div>
              <div className="font-semibold text-slate-800">{item.productName}</div>
              <div className="text-xs text-slate-500">{item.productCategory || '-'}</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'المزايد',
      accessor: 'bidderUsername',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.bidderUsername}</div>
          <div className="text-xs text-slate-500">{item.bidderEmail}</div>
          <div className="text-xs text-slate-400">{item.bidderType}</div>
        </div>
      ),
    },
    {
      header: 'نوع المزايدة',
      accessor: 'bidType',
      render: (item) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          item.bidType === 'fixed' 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-orange-100 text-orange-700'
        }`}>
          {item.bidType === 'fixed' ? '💰 سعر ثابت' : '🔥 مزاد'}
        </span>
      ),
    },
    {
      header: 'المبلغ',
      accessor: 'bidAmount',
      render: (item) => (
        <span className="font-bold text-green-700">
          {Number(item.bidAmount).toLocaleString('ar-EG')} ر.س
        </span>
      ),
    },
    {
      header: 'حالة المنتج',
      accessor: 'productStatus',
      render: (item) => {
        const statusMap = {
          active: { label: '🟢 نشط', color: 'bg-green-100 text-green-700' },
          sold: { label: '✅ مباع', color: 'bg-purple-100 text-purple-700' },
          expired: { label: '⏰ منتهي', color: 'bg-red-100 text-red-700' },
        };
        const status = statusMap[item.productStatus] || { label: item.productStatus, color: 'bg-gray-100 text-gray-700' };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      header: 'التاريخ',
      accessor: 'bidTime',
      render: (item) => (
        <div className="text-center">
          <div className="text-sm text-slate-700">
            {item.bidTime ? new Date(item.bidTime).toLocaleDateString('ar-EG') : '-'}
          </div>
          <div className="text-xs text-slate-400">
            {item.bidTime ? new Date(item.bidTime).toLocaleTimeString('ar-EG') : ''}
          </div>
        </div>
      ),
    },
  ];

  // ✅ إحصائيات بسيطة
  const stats = useMemo(() => {
    const total = bids.length;
    const totalAmount = bids.reduce((sum, b) => sum + (b.bidAmount || 0), 0);
    return { total, totalAmount };
  }, [bids]);

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-950">📊 المزايدات</h2>
            <p className="text-sm text-slate-500 mt-1">
              {stats.total} مزايدة | إجمالي المبالغ: {stats.totalAmount.toLocaleString()} ر.س
            </p>
          </div>
        </div>
      </div>

      {/* الفلاتر */}
      <DataFilters
        activeSection="المزايدات"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        filterConfig={filterConfig}
      />

      {/* عرض البيانات */}
      {error ? (
        <div className="rounded-3xl bg-red-50 p-4 text-red-700 shadow-sm mt-4 border border-red-200">
          ❌ {error}
        </div>
      ) : loading ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-700 shadow-sm mt-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">جارٍ تحميل المزايدات...</p>
        </div>
      ) : finalBids.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500 shadow-sm mt-4">
          <p className="text-4xl mb-2">🔍</p>
          <p>لا توجد مزايدات مطابقة للبحث</p>
        </div>
      ) : (
        <AdminTable
          data={finalBids}
          columns={columns}
          filterColumns={{ bidType: filters.bidType }}
          searchField="productName"
          itemName="المزايدات"
          pageSize={5}
          optionseting={false}
        />
      )}
    </div>
  );
}