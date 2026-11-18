import React from 'react';
import { Check, X } from 'lucide-react';

export default function SkillTag({ name, status = 'default', size = 'sm' }) {
  // status: 'matched' (green), 'missing' (rose), 'default' (slate), 'preferred' (blue)
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = null;

  if (status === 'matched') {
    styleClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    Icon = Check;
  } else if (status === 'missing') {
    styleClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = X;
  } else if (status === 'preferred') {
    styleClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  const sizeClass = size === 'xs' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-md font-medium border ${styleClasses} ${sizeClass} transition-colors`}>
      {Icon && <Icon className="w-3 h-3 stroke-[2.5]" />}
      <span>{name}</span>
    </span>
  );
}

