import React from 'react';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function Badge({ status, size = 'sm' }: BadgeProps) {
  const norm = (status || '').toLowerCase().trim();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['completed', 'paid', 'good', 'active'].includes(norm)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['in_progress', 'confirmed', 'fair'].includes(norm)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['pending', 'issued', 'worn', 'low'].includes(norm)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['cancelled', 'overdue', 'damaged', 'critical', 'danger'].includes(norm)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['assigned', 'draft'].includes(norm)) {
    styles = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm font-medium';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border capitalize ${sizeClass} ${styles}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
