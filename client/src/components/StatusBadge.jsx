import React from 'react';

const STATUS_STYLES = {
  // Positive / Successful
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-teal-50 text-teal-700 border-teal-200',
  
  // Pending / In-progress
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  booked: 'bg-brand-50 text-brand-700 border-brand-200',
  
  // Negative / Cancelled
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  refunded: 'bg-slate-100 text-slate-700 border-slate-300',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  charged_back: 'bg-rose-100 text-rose-800 border-rose-300',
  
  // Types
  hospital: 'bg-sky-50 text-sky-700 border-sky-200',
  channeling_centre: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export const StatusBadge = ({ status, className = '' }) => {
  const norm = (status || '').toLowerCase().trim();
  const style = STATUS_STYLES[norm] || 'bg-slate-50 text-slate-700 border-slate-200';
  const label = norm.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {label}
    </span>
  );
};

export default StatusBadge;
