import React from "react";
import Prodectshow from "./prodectshow";

function ProductComplex({ products }) {
  // التحقق من وجود منتجات
  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-10 text-center shadow-sm">
        <p className="text-xl font-medium text-gray-500">
          لا توجد منتجات متاحة حالياً
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-full py-2.5">
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        {products.map((product, index) => (
          <div key={product._id || index} className="flex min-h-[420px] h-full">
            <Prodectshow items={product} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductComplex;