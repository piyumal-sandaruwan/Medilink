import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 bg-slate-200 rounded w-full"></div>
      <div className="h-3 bg-slate-200 rounded w-4/5"></div>
    </div>
    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
      <div className="h-8 bg-slate-200 rounded w-24"></div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
    <div className="h-12 bg-slate-100 border-b border-slate-200"></div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between space-x-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          <div className="h-8 bg-slate-200 rounded w-20"></div>
        </div>
      ))}
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 border border-slate-200 shadow-sm animate-pulse space-y-6">
    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
      <div className="w-24 h-24 bg-slate-200 rounded-full"></div>
      <div className="space-y-2 text-center sm:text-left flex-1">
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
      </div>
    </div>
    <div className="space-y-3 pt-4 border-t border-slate-100">
      <div className="h-4 bg-slate-200 rounded w-full"></div>
      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
    </div>
  </div>
);

export default {
  CardSkeleton,
  TableSkeleton,
  ProfileSkeleton,
};
