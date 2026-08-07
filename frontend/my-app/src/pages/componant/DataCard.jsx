import React from "react";

export default function DataCard({ card, onClick }) {
    return (
        <button
            type="button"
            onClick={() => onClick(card.path)}
            className="group rounded-3xl border border-slate-200 bg-slate-50 p-6 text-right shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:bg-cyan-50"
        >
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-950">{card.label}</h3>
                    <p className="mt-2 text-sm text-slate-500">عرض وإدارة {card.label.toLowerCase()} هنا.</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-500 text-2xl text-white transition duration-300 group-hover:bg-cyan-600">
                    {card.icon}
                </div>
            </div>
        </button>
    );
}
