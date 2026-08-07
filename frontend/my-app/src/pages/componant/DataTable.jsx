import React, { useMemo } from "react";

const getNestedValue = (obj, path) => {
  if (!obj || !path || typeof path !== "string") return undefined;

  if (path.includes("_")) {
    const [a, b] = path.split("_");
    return obj?.[a]?.[b];
  }

  return obj?.[path];
};

const getImageUrl = (value) => {
  if (!value) return null;
  const url = String(value);
  return url.startsWith("http") ? url : `http://localhost:5000${url}`;
};

const isImageAccessor = (accessor) => {
  if (!accessor) return false;
  const lower = accessor.toLowerCase();
  return (
    lower.includes("image") ||
    lower.includes("img") ||
    lower.includes("photo") ||
    lower.includes("avatar")
  );
};

export default function DataTable({ columns = [], data = [], emptyText }) {
  if (!data?.length) {
    return (
      <div className="p-6 text-slate-500 border rounded-2xl">
        {emptyText}
      </div>
    );
  }

  const finalColumns = useMemo(() => {
    return columns;
  }, [columns]);

  return (
    <div className="overflow-x-auto border rounded-2xl bg-white">
      <table className="min-w-full text-right text-sm">
        <thead className="bg-slate-100">
          <tr>
            {finalColumns.map((col) => (
              <th key={col.accessor || col.header} className="p-4 border-b">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row._id || rowIndex} className="border-b hover:bg-slate-50">
              {finalColumns.map((col) => {
                const value = getNestedValue(row, col.accessor);
                const image = isImageAccessor(col.accessor)
                  ? getImageUrl(value)
                  : null;

                return (
                  <td key={col.accessor || col.header} className="p-4">
                    {col.render ? (
                      col.render(row)
                    ) : image ? (
                      <img
                        src={image}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      String(value ?? "-")
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}