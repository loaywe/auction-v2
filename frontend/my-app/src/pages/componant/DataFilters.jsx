import React from "react";
import SearchInput from "./SearchInput";

export default function DataFilters({
  activeSection,
  filters,
  onFiltersChange,
  onReset,
  filterConfig = [], // 🔥 تكوين الفلاتر
}) {
  const handleChange = (field) => (event) => {
    onFiltersChange({
      ...filters,
      [field]: event.target.value,
    });
  };

  const handleSearch = (value) => {
    onFiltersChange({
      ...filters,
      search: value,
    });
  };

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl mb-6">

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
     

        <button
          onClick={onReset}
          className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
        >
          إعادة ضبط
        </button>
      </div>

      {/* 🔥 Dynamic Filters */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">

        {/* حقل البحث */}
        <div className="md:col-span-1">
          <SearchInput
            value={filters.search || ""}
            onSearch={handleSearch}
            placeholder="🔍 بحث..."
          />
        </div>

        {/* الفلاتر الأخرى */}
        {filterConfig.map((filter) => (
          <label key={filter.key} className="text-right text-sm font-medium text-slate-700">
            {filter.label}
            {filter.type === "select" && (
              <select
                value={filters[filter.key] || "all"}
                onChange={handleChange(filter.key)}
                className="mt-1 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </label>
        ))}

      </div>
    </div>
  );
}