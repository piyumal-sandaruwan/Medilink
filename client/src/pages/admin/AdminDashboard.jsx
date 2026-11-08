import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../api/client.js';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        toast.error('Failed to load administrator analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const totals = stats?.totals || {};
  const bookingTrend = stats?.bookingTrend || [];
  const topSpecs = stats?.topSpecializations || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Platform Command Center
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-0.5">MediLink Platform Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time channeling metrics, transaction summaries and doctor licensing across Sri Lanka.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/doctors"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-1"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Doctor Approvals ({totals.pendingDoctors || 0})</span>
          </Link>
          <Link
            to="/admin/hospitals"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
          >
            Manage Facilities
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Patients
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totals.totalPatients || 0}</div>
          <span className="text-[10px] text-brand-600 font-semibold">Registered users</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Approved Doctors
          </span>
          <div className="text-2xl font-black text-brand-700 mt-1">{totals.totalDoctors || 0}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">Verified SLMC</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pending Doctors
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">{totals.pendingDoctors || 0}</div>
          <span className="text-[10px] text-amber-600 font-semibold">Review required</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Partner Hospitals
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totals.totalHospitals || 0}</div>
          <span className="text-[10px] text-slate-500 font-semibold">Active facilities</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Channelings
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totals.totalAppointments || 0}
          </div>
          <span className="text-[10px] text-brand-600 font-semibold">All-time bookings</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Simulated Revenue
          </span>
          <div className="text-xl font-black text-emerald-700 mt-1">
            LKR {((totals.totalRevenue || 0) / 1000).toFixed(0)}k
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">Paid bookings</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 14-Day Booking Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-brand-600" /> 14-Day Channeling Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily appointment booking volume</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#0d9488"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBookings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Specializations Bar Chart */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center">
              <Activity className="w-5 h-5 mr-2 text-brand-600" /> Top Specialties
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Highest channeling volume</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSpecs} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={90}
                  tick={{ fontSize: 10, fill: '#475569' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="bookings" fill="#14b8a6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
