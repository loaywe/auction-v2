import React from "react";

const GetNestedValue = (obj, path) => {
  if (!obj) return undefined;

  if (path.includes("_")) {
    const [a, b] = path.split("_");
    return obj?.[a]?.[b];
  }

  return obj?.[path];
};

export default function FilterSelect({ items, filter, setFilter, filterKey, label, allLabel = "الكل", options }) {
  const values = options
    ? options
    : items
      ? [...new Set(items.map((item) => getNestedValue(item, filterKey)).filter((value) => value !== undefined && value !== null && value !== ""))]
      : [];

  return (
    <label className="space-y-2 text-right text-sm font-medium text-slate-700">
      {label}
      <select
        value={filter[filterKey] ?? "all"}
        onChange={(e) => setFilter((prev) => ({ ...prev, [filterKey]: e.target.value }))}
        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
      >
        <option value="all">{allLabel}</option>
        {values.map((value, index) => (
          <option key={index} value={String(value)}>
            {String(value)}
          </option>
        ))}
      </select>
    </label>
  );
}
