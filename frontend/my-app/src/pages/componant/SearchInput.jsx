import React from "react";

export default function SearchInput({ value, onSearch, placeholder = "🔍 Search" }) {
  return (
    <div className="ptcot">
      <input
        type="text"
        value={value}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
      />
    </div>
  );
}
