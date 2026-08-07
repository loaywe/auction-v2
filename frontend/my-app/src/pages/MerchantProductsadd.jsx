import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const baseUrl = "http://localhost:5000";

export default function MerchantAddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  // ✅ حالة النموذج
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    category: "إلكترونيات",
    condition: "new",
    startingPrice: "",
    fixedPrice: "",
    auctionEndTime: "",
    quantity: 1,
    image: null,
  });

  // =============================================
  // ✅ معالجة تغيير الحقول
  // =============================================
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, image: file }));
      // عرض معاينة الصورة
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // =============================================
  // ✅ إرسال النموذج
  // =============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("❌ يرجى تسجيل الدخول أولاً");
        setLoading(false);
        return;
      }

      // ✅ إنشاء FormData لإرسال الملفات
      const data = new FormData();
      data.append("productName", formData.productName);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("condition", formData.condition);
      data.append("startingPrice", formData.startingPrice);
      data.append("quantity", formData.quantity);

      // ✅ معالجة السعر الثابت والمزاد
      if (formData.fixedPrice && parseFloat(formData.fixedPrice) > 0) {
        data.append("fixedPrice", formData.fixedPrice);
      }

      if (formData.auctionEndTime) {
        data.append("auctionEndTime", formData.auctionEndTime);
      }

      if (formData.image) {
        data.append("image", formData.image);
      }

      // ✅ إرسال الطلب
      const response = await axios.post(`${baseUrl}/merchant/products`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("✅ تم إضافة المنتج بنجاح!");
      setFormData({
        productName: "",
        description: "",
        category: "إلكترونيات",
        condition: "new",
        startingPrice: "",
        fixedPrice: "",
        auctionEndTime: "",
        quantity: 1,
        image: null,
      });
      setImagePreview(null);

      // ✅ الانتقال إلى صفحة المنتجات بعد 2 ثانية
      setTimeout(() => {
        navigate("/my-products/products");
      }, 2000);
    } catch (err) {
      console.error("❌ Error adding product:", err);
      setError(err.response?.data?.error || err.message || "فشل إضافة المنتج");
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // ✅ العرض
  // =============================================
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 text-right">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-950">➕ إضافة منتج جديد</h2>
        <p className="text-xs text-slate-400">أضف منتجاً جديداً إلى متجرك</p>
      </div>

      {/* ✅ رسائل الخطأ والنجاح */}
      {error && (
        <div className="rounded-3xl bg-red-50 p-4 text-red-700 shadow-sm mb-4 border border-red-200">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="rounded-3xl bg-green-50 p-4 text-green-700 shadow-sm mb-4 border border-green-200">
          {success}
        </div>
      )}

      {/* ✅ النموذج */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* اسم المنتج */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              اسم المنتج <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              required
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
              placeholder="أدخل اسم المنتج"
            />
          </div>

          {/* الفئة */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              الفئة <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
            >
              <option value="إلكترونيات">إلكترونيات</option>
              <option value="العقارات">العقارات</option>
              <option value="مركبات">مركبات</option>
              <option value="أزياء">أزياء</option>
              <option value="أثاث">أثاث</option>
              <option value="اخرى">أخرى</option>
            </select>
          </div>

          {/* حالة المنتج */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              حالة المنتج <span className="text-red-500">*</span>
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
            >
              <option value="new">جديد</option>
              <option value="used">مستعمل</option>
            </select>
          </div>

          {/* الكمية */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              الكمية
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
              placeholder="الكمية المتوفرة"
            />
          </div>

          {/* سعر البداية */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              سعر البداية (ريال) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="startingPrice"
              value={formData.startingPrice}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
              placeholder="مثال: 100"
            />
          </div>

          {/* السعر الثابت */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              السعر الثابت (ريال) - اختراري
            </label>
            <input
              type="number"
              name="fixedPrice"
              value={formData.fixedPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
              placeholder="إذا كان سعراً ثابتاً"
            />
            <p className="text-xs text-slate-400 mt-1">
              اتركه فارغاً إذا كان المنتج للمزاد
            </p>
          </div>

          {/* وقت انتهاء المزاد */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              وقت انتهاء المزاد - اختباري
            </label>
            <input
              type="datetime-local"
              name="auctionEndTime"
              value={formData.auctionEndTime}
              onChange={handleChange}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
            />
            <p className="text-xs text-slate-400 mt-1">
              مطلوب إذا كان المنتج للمزاد (و fixedPrice فارغ)
            </p>
          </div>

          {/* وصف المنتج (يمتد على عمودين) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              الوصف
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 resize-none"
              placeholder="وصف المنتج..."
            />
          </div>

          {/* صورة المنتج */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              صورة المنتج <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                required={!imagePreview}
                className="w-full sm:w-auto rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
              />
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="معاينة المنتج"
                    className="w-24 h-24 rounded-xl object-cover border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData((prev) => ({ ...prev, image: null }));
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">يُفضل استخدام صورة مربعة (JPG, PNG, SVG)</p>
          </div>
        </div>

        {/* ✅ أزرار الإرسال */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 rounded-3xl px-6 py-3 font-semibold text-white transition ${
              loading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-cyan-600 hover:bg-cyan-700 hover:shadow-lg shadow-md"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                جاري الإضافة...
              </span>
            ) : (
              "➕ إضافة المنتج"
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/myproducts/products")}
            className="rounded-3xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}