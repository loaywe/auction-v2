import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminTable from "./componant/AdminTable";
import DataFilters from "./componant/DataFilters";
import { Link, useNavigate } from "react-router-dom";
const baseUrl = "http://localhost:5000";

export default function DataUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // الفلاتر المحلية
  const [filters, setFilters] = useState({
    search: "",
    userType: "all",
    gender: "all",
    isVerified: "all",
  });

  // ---------------- FETCH USERS ----------------
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setError("يرجى تسجيل الدخول أولاً");
          setLoading(false);
          return;
        }

        const res = await axios.get(`${baseUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(res.data || []);
        setError("");
      } catch (err) {
        console.log("Error fetching users:", err);
        setError(err.response?.data?.error || err.message || "فشل جلب المستخدمين");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // ---------------- HANDLE FILTERS ----------------
  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      userType: "all",
      gender: "all",
      isVerified: "all",
    });
  };

  // ---------------- FILTER USERS ----------------
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const search = filters.search?.toLowerCase() || "";

      const searchOk =
        !search ||
        u.username?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.phone?.toLowerCase().includes(search);

      const typeOk =
        filters.userType === "all" || u.userType === filters.userType;

      const genderOk =
        filters.gender === "all" || u.gender === filters.gender;

      const verifiedOk =
        filters.isVerified === "all" ||
        String(u.isVerified) === filters.isVerified;

      return searchOk && typeOk && genderOk && verifiedOk;
    });
  }, [users, filters]);

  // ---------------- CLEAN + ORDER DATA ----------------
  const finalUsers = useMemo(() => {
    return filteredUsers.map((u) => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      userType: u.userType,
      gender: u.gender,
      isVerified: u.isVerified,
      phone: u.phone,
      address: u.address,
      age: u.age,
      WalletBalance: u.WalletBalance || u.walletBalance || 0,
      idImage: u.idImage,
      subscriptionDate: u.subscriptionDate,
    }));
  }, [filteredUsers]);

  // ---------------- DELETE USER ----------------
  const handleDelete = async (user) => {
    if (!user || !user._id) {
      alert("خطأ: معرف المستخدم غير موجود");
      return;
    }

    const confirmDelete = window.confirm(
      `هل أنت متأكد من حذف المستخدم "${user.username}"؟`
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseUrl}/admin/users/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(prevUsers => prevUsers.filter(u => u._id !== user._id));
      alert(`✅ تم حذف المستخدم "${user.username}" بنجاح`);
    } catch (err) {
      console.log("Error deleting user:", err);
      alert(`❌ فشل حذف المستخدم: ${err.response?.data?.error || err.message}`);
    }
  };

  // ---------------- EDIT USER ----------------
  const handleEdit = (user) => {
    if (!user || !user.username) {
      console.error('❌ Username is missing');
      alert('خطأ: اسم المستخدم غير موجود');
      return;
    }

    console.log(`🔍 Navigating to edit user: ${user.username}`);
    navigate(`/datamaneg/edit-User/${user.username}`);
  };

  // ---------------- FILTER CONFIG ----------------
  const filterConfig = [
    {
      key: 'userType',
      label: 'نوع المستخدم',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'customer', label: 'عميل' },
        { value: 'merchant', label: 'تاجر' },
        { value: 'delivery', label: 'مندوب' },
        { value: 'admin', label: 'مسؤول' },
      ]
    },
    {
      key: 'gender',
      label: 'الجنس',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'male', label: 'ذكر' },
        { value: 'female', label: 'أنثى' },
      ]
    },
    {
      key: 'isVerified',
      label: 'التوثيق',
      type: 'select',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'true', label: 'موثق' },
        { value: 'false', label: 'غير موثق' },
      ]
    },
  ];

  // ---------------- COLUMNS ----------------
  const columns = [
    {
      header: "المستخدم",
      accessor: "username",
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.idImage && (
            <img
              src={item.idImage.startsWith('http') ? item.idImage : `${baseUrl}${item.idImage}`}
              alt="user"
              className="w-10 h-10 rounded-full object-cover border"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.png';
              }}
            />
          )}
          <span className="font-bold">{item.username}</span>
        </div>
      ),
    },
    {
      header: "الإيميل",
      accessor: "email",
    },
    {
      header: "الهاتف",
      accessor: "phone",
    },
    {
      header: "العنوان",
      accessor: "address",
    },
    {
      header: "العمر",
      accessor: "age",
    },
    {
      header: "الجنس",
      accessor: "gender",
      render: (item) => (
        <span>
          {item.gender === 'male' ? 'ذكر' : item.gender === 'female' ? 'أنثى' : item.gender}
        </span>
      ),
    },
    {
      header: "النوع",
      accessor: "userType",
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          item.userType === 'admin' ? 'bg-purple-100 text-purple-700' :
          item.userType === 'merchant' ? 'bg-blue-100 text-blue-700' :
          item.userType === 'delivery' ? 'bg-orange-100 text-orange-700' :
          'bg-green-100 text-green-700'
        }`}>
          {item.userType === 'customer' ? 'عميل' : 
           item.userType === 'merchant' ? 'تاجر' : 
           item.userType === 'delivery' ? 'مندوب' : 
           item.userType === 'admin' ? 'مسؤول' : item.userType}
        </span>
      ),
    },
    {
      header: "المحفظة",
      accessor: "WalletBalance",
      render: (item) => (
        <span className="font-semibold text-green-700">
          {Number(item.WalletBalance).toLocaleString('ar-EG')} ر.س
        </span>
      ),
    },
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
          {item.isVerified ? "✅ موثق" : "❌ غير موثق"}
        </span>
      ),
    },
    {
      header: "تاريخ التسجيل",
      accessor: "subscriptionDate",
      render: (item) => (
        <span className="text-sm">
          {item.subscriptionDate ? new Date(item.subscriptionDate).toLocaleDateString('ar-EG') : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">المستخدمين</h2>
          <p className="text-xs text-slate-400">عدد المستخدمين: {finalUsers.length}</p>
        </div>
        <Link
          to="/datamaneg/add-user"
          className="inline-flex items-center justify-center rounded-3xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 hover:shadow-lg shadow-md"
        >
          ➕ إضافة مستخدم
        </Link>
      </div>

      {/* الفلاتر */}
      <DataFilters
        activeSection="المستخدمين"
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
          <p>جارٍ تحميل المستخدمين...</p>
        </div>
      ) : finalUsers.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500 shadow-sm mt-4">
          <p className="text-4xl mb-2">👤</p>
          <p>لا يوجد مستخدمين لعرضهم</p>
        </div>
      ) : (
        <AdminTable
          data={finalUsers}
          columns={columns}
          filterColumns={{ userType: 'all', gender: 'all', isVerified: 'all' }}
          searchField="username"
          itemName="المستخدمين"
          pageSize={5}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}