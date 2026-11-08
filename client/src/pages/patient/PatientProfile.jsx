import React from 'react';
import { User, Mail, Phone, ShieldCheck, HeartPulse } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const PatientProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Patient Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your personal MediLink account details and contact information.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-brand-600/20">
            {user?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 capitalize mt-1">
              {user?.role} Account
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" /> Email Address
            </span>
            <p className="font-semibold text-slate-800">{user?.email}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> Phone Number
            </span>
            <p className="font-semibold text-slate-800">{user?.phone || 'Not provided'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Account Status
            </span>
            <p className="font-semibold text-emerald-700">
              {user?.isActive ? 'Active & Verified' : 'Inactive'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <HeartPulse className="w-3.5 h-3.5 mr-1 text-brand-600" /> Member Since
            </span>
            <p className="font-semibold text-slate-800">
              {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-GB', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
