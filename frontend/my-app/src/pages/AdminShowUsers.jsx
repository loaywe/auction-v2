import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import AdminTable from './componant/AdminTable';

function AdminShowUsers() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.userType !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sortedUsers = response.data.users
          .filter((item) => item.userType !== 'admin')
          .sort((a, b) => new Date(b.subscriptionDate) - new Date(a.subscriptionDate));

        setUsers(sortedUsers);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'حدث خطأ في جلب المستخدمين');
      }
    };

    fetchUsers();
  }, [navigate, user]);

  const handleEdit = (username) => {
    navigate('/edit-profile', { state: { username } });
  };

  const handleDelete = async (username) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/admin/users/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((user) => user.username !== username));
      setError('تم حذف المستخدم بنجاح');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'فشل حذف المستخدم');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-slate-900" dir="rtl">
      <div className="mx-auto w-full max-w-[1260px] space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">إدارة المستخدمين</h1>
              <p className="mt-2 text-sm text-slate-600">تحكم بكل مستخدمي النظام، وابحث وفرّز حسب النوع والحالة.</p>
            </div>
            <button
              onClick={() => navigate('/datamaneg/add-user')}
              className="inline-flex items-center justify-center rounded-3xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              + إضافة مستخدم
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl bg-red-50 p-4 text-right text-sm text-red-700 shadow-sm shadow-red-100">
            {error}
          </div>
        )}

        <AdminTable
          data={users}
          columns={[
            { header: 'الصورة', accessor: 'idImage' },
            { header: 'اسم المستخدم', accessor: 'username' },
            { header: 'البريد الإلكتروني', accessor: 'email' },
            { header: 'الهاتف', accessor: 'phone' },
            { header: 'العمر', accessor: 'age' },
            { header: 'الجنس', accessor: 'gender' },
            { header: 'نوع المستخدم', accessor: 'userType' },
            { header: 'مفعل', accessor: 'isVerified' },
            { header: 'تاريخ الاشتراك', accessor: 'subscriptionDate' },
          ]}
          filterColumns={{ userType: 'all', isVerified: 'all', gender: 'all' }}
          filterDefinitions={[
            { key: 'userType', label: 'نوع المستخدم', allLabel: 'كل الأنواع', options: ['customer', 'merchant', 'delivery'] },
            { key: 'isVerified', label: 'التحقق', allLabel: 'الكل', options: ['true', 'false'] },
            { key: 'gender', label: 'الجنس', allLabel: 'الكل', options: ['male', 'female'] },
          ]}
          searchField="username"
          excludeColumns={['password', '__v']}
          itemName="المستخدمين"
          pageSize={5}
          onEdit={(item) => handleEdit(item.username)}
          onDelete={(item) => handleDelete(item.username)}
          title="إدارة المستخدمين"
        />
      </div>
    </div>
  );
}

export default AdminShowUsers;
