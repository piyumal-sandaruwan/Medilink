import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Building2,
  Users,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Stethoscope,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

export const DoctorDashboard = () => {
  const { user, doctor, refreshMe } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedRes, hospRes] = await Promise.all([
          api.get('/schedules/mine'),
          api.get('/doctors/me/hospitals'),
        ]);
        if (schedRes.success) setSchedules(schedRes.data || []);
        if (hospRes.success) setHospitals(hospRes.data || []);
      } catch (err) {
        console.error('Doctor dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules.filter((s) => {
    if (s.status !== 'active') return false;
    const sDate = new Date(s.date).toISOString().split('T')[0];
    return sDate === todayStr;
  });

  const upcomingSchedules = schedules.filter((s) => {
    if (s.status !== 'active') return false;
    const sDate = new Date(s.date).toISOString().split('T')[0];
    return sDate >= todayStr;
  });

  const totalPatientsChanneled = schedules.reduce((acc, s) => acc + (s.bookedCount || 0), 0);
  const approvedHospitalsCount = hospitals.filter((h) => h.status === 'approved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Welcome, Dr. {user?.name?.replace(/^Dr\.?\s*/i, '')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Specialist in {doctor?.specialization?.name || 'General Medicine'} • SLMC: {doctor?.slmcNo}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/doctor/schedules"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            Create New Session
          </Link>
          <Link
            to="/doctor/profile"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Approval Status Banner if Pending */}
      {doctor?.approvalStatus === 'pending' && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start space-x-3 text-xs text-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Verification Pending:</strong>
            Your profile is currently under review by our administrative team. Once verified,
            your profile will be visible in public searches and you can publish channeling sessions.
          </div>
        </div>
      )}

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Today's Sessions
          </div>
          <div className="text-3xl font-black text-brand-700">{todaySchedules.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Active channeling sessions today</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Upcoming Sessions
          </div>
          <div className="text-3xl font-black text-brand-700">{upcomingSchedules.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Scheduled for next 14 days</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Total Patients Booked
          </div>
          <div className="text-3xl font-black text-brand-700">{totalPatientsChanneled}</div>
          <p className="text-[11px] text-slate-500 mt-1">Across all channeling sessions</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Approved Hospitals
          </div>
          <div className="text-3xl font-black text-brand-700">{approvedHospitalsCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            <Link to="/doctor/hospitals" className="text-brand-600 hover:underline">
              Manage affiliations →
            </Link>
          </p>
        </div>
      </div>

      {/* Today's Channeling Sessions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-brand-600" /> Today's Channeling Sessions
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        {todaySchedules.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl">
            No channeling sessions scheduled for today.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todaySchedules.map((s) => (
              <div
                key={s._id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 text-base">{s.startTime} - {s.endTime}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{s.hospital?.name}</span>
                    <span>•</span>
                    <span>{s.hospital?.city}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
                    {s.bookedCount} / {s.maxPatients} Booked
                  </span>
                  <Link
                    to={`/doctor/schedules/${s._id}/patients`}
                    className="px-4 py-2 bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    View Patient Roster →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
