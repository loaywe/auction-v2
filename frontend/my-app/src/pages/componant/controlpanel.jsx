


import { Link } from "react-router-dom";
 export default function ControlPanel({ handleNavigation, cards, activeItem }) {
    return (
        <aside className="order-2 w-80 shrink-0 border-l border-slate-200 bg-white/95 px-5 py-6 shadow-lg shadow-slate-200/20">
<div className="space-y-3">
  {cards.map((item) => (
      <button
        type="button"
        onClick={() => handleNavigation(item.path)}
        className={`flex w-full items-center justify-between rounded-3xl px-4 py-3 text-right text-sm font-semibold transition ${
          activeItem === item.path
            ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
        }`}>
      
        <span>{item.label}</span>
        <span className="text-xl">{item.icon}</span>
      </button>
  ))}
</div>
        </aside>
    );
}
