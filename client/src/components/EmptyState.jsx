import React from 'react';
import { CalendarX, Search } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = CalendarX,
  title = 'No items found',
  description = 'There are no records matching your current filter criteria.',
  action = null,
}) => {
  return (
    <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-slate-300">
      <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
