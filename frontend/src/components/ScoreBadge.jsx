import React from 'react';

export default function ScoreBadge({ score, size = 'md', showLabel = true }) {
  const num = typeof score === 'number' ? score : parseFloat(score) || 0;
  
  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';
  let tierLabel = 'Excellent Match';

  if (num >= 80) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
    tierLabel = 'Top Match';
  } else if (num >= 65) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
    tierLabel = 'Solid Match';
  } else if (num >= 50) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
    tierLabel = 'Moderate';
  } else {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
    tierLabel = 'Low Fit';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-sm px-2.5 py-1 font-semibold',
    lg: 'text-base px-3.5 py-1.5 font-bold',
    xl: 'text-2xl px-5 py-2.5 font-extrabold',
  }[size] || 'text-sm px-2.5 py-1 font-semibold';

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${sizeClasses}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
      <span>{num.toFixed(1)}%</span>
      {showLabel && size !== 'sm' && (
        <span className="text-xs font-normal opacity-80 pl-1 border-l border-current/20">
          {tierLabel}
        </span>
      )}
    </div>
  );
}

