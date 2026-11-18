import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
      gradient: 'from-blue-500/10 to-transparent',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
      gradient: 'from-emerald-500/10 to-transparent',
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600',
      border: 'border-indigo-100',
      gradient: 'from-indigo-500/10 to-transparent',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
      gradient: 'from-amber-500/10 to-transparent',
    },
  }[color] || {
    bg: 'bg-blue-50 text-blue-600',
    border: 'border-blue-100',
    gradient: 'from-blue-500/10 to-transparent',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${colorMap.gradient} rounded-bl-full pointer-events-none`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colorMap.bg} shadow-inner`}>
            <Icon className="w-6 h-6 stroke-[2]" />
          </div>
        )}
      </div>
    </div>
  );
}

