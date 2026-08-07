import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DataTable from "./DataTable";

const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;

  if (path.includes("_")) {
    const [a, b] = path.split("_");
    return obj?.[a]?.[b];
  }

  return obj?.[path];
};

export default function AdminTable({
  data = [],
  columns = [],
  defaultColumns = [],
  excludeColumns = [],
  itemName = "item",
  pageSize = 5,
  onEdit,
  onDelete,
  filterColumns = {},
  filterDefinitions = [],
  searchField = "",
optionseting=true,


}) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});

  const navigate = useNavigate();
  const location = useLocation();
  const endpoint = location.pathname.split("/")[1] || "";

  // reset page when data changes
  useEffect(() => {
    setPage(1);
  }, [data]);

  // تطبيق الفلاتر على البيانات
  const filteredData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.filter((item) => {
      if (filters.search && searchField) {
        const searchValue = getNestedValue(item, searchField);
        if (!searchValue?.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
      }

      for (const [key, value] of Object.entries(filterColumns)) {
        if (value !== "all" && value !== "") {
          const itemValue = getNestedValue(item, key);
          if (String(itemValue) !== String(value)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, filters, filterColumns, searchField]);

  // KEYS
  const keys = useMemo(() => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) return [];

    return Object.keys(filteredData[0])
      .filter((k) => !excludeColumns.includes(k))
      .flatMap((key) => {
        const value = filteredData[0][key];

        if (value && typeof value === "object" && !Array.isArray(value)) {
          return Object.keys(value).map((sub) => `${key}_${sub}`);
        }

        return key;
      });
  }, [filteredData, excludeColumns]);

  // PAGINATION
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const visibleData = useMemo(() => {
    return filteredData.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredData, page, pageSize]);

  // COLUMNS
  const baseColumns =
    columns.length > 0
      ? columns
      : keys.length > 0
      ? keys.map((k) => ({ header: k, accessor: k }))
      : defaultColumns.map((c) => ({ header: c, accessor: c }));

  // ACTIONS
// ✅ إضافة أعمدة الإجراءات فقط إذا كان optionseting = true
const columnsToRender = useMemo(() => {
  const cols = [...baseColumns];
  
  if (optionseting) {
    cols.push({
      header: "الإجراءات",
      accessor: "actions",
      render: (item) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() =>
              onEdit
                ? onEdit(item)
                : navigate(`/edit/${endpoint}/${item._id}`)
            }
            className="px-3 py-1 bg-blue-100 rounded-xl hover:bg-blue-200 transition"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete && onDelete(item)}
            className="px-3 py-1 bg-red-100 rounded-xl hover:bg-red-200 transition"
          >
            🗑️
          </button>
        </div>
      ),
    });
  }
  
  return cols;
}, [baseColumns, optionseting, onEdit, onDelete, navigate, endpoint]);
  // RENDER PAGE NUMBERS
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setPage(1)}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 transition"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="dots1" className="px-2 text-slate-400">...</span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`w-10 h-10 rounded-full transition ${
            page === i
              ? "bg-blue-600 text-white shadow-md"
              : "bg-slate-100 hover:bg-slate-200"
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="dots2" className="px-2 text-slate-400">...</span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => setPage(totalPages)}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 transition"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, filteredData.length);

  // ✅ إظهار الترقيم دائماً إذا كان هناك بيانات
  const showPagination = filteredData.length > 0;

  return (
    <div className="p-6 bg-white rounded-2xl shadow">

      {/* TABLE */}
      <DataTable
        columns={columnsToRender}
        data={visibleData}
        emptyText={`لا توجد ${itemName}`}
      />

      {/* PAGINATION - يظهر دائماً إذا كان هناك بيانات */}
      {showPagination && (
        <div className="flex flex-col items-center gap-4 mt-6 pt-4 border-t border-slate-100">
          {/* معلومات عدد العناصر */}
          <div className="text-sm text-slate-600">
            عرض <span className="font-semibold">{startItem}</span> - <span className="font-semibold">{endItem}</span> من <span className="font-semibold">{filteredData.length}</span> {itemName}
          </div>

          {/* أزرار التنقل */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* السابق */}
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              ← السابق
            </button>

            {/* أرقام الصفحات */}
            <div className="flex items-center gap-1 mx-2">
              {renderPageNumbers()}
            </div>

            {/* التالي */}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              التالي →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}