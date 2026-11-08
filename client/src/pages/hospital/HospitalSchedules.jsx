import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Stethoscope, Users, Building2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export const HospitalSchedules = () => {
  const { user, hospital } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user?.hospital) return;
      try {
        const res = await api.get(`/schedules?hospitalId=${user.hospital}`);
        if (res.success && res.data) {
          setSchedules(res.data);
        }
      } catch (err) {
        toast.error('Failed to load hospital schedules.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
          Hospital Administrator Portal
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
          {hospital?.name || 'Hospital'} Channeling Sessions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor all specialist channeling sessions hosted at your facility.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-lg">
            Active Channeling Sessions ({schedules.length})
          </h3>
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : schedules.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No sessions scheduled"
            description="There are currently no active channeling sessions scheduled at your facility."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {schedules.map((s) => {
              const remaining = s.maxPatients - s.bookedCount;
              return (
                <div
                  key={s._id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 text-base">
                        {new Date(s.date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        {s.startTime} - {s.endTime}
                      </span>
                      <StatusBadge status={s.status} />
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-600">
                      <span className="font-bold text-slate-800 flex items-center">
                        <Stethoscope className="w-3.5 h-3.5 mr-1 text-brand-600" />
                        {s.doctor?.user?.name}
                      </span>
                      <span>•</span>
                      <span className="text-brand-700 font-semibold">
                        {s.doctor?.specialization?.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-xs font-bold text-brand-700 block">
                        {s.bookedCount} / {s.maxPatients} Booked
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {remaining} seat{remaining === 1 ? '' : 's'} remaining
                      </span>
                    </div>

                    <Link
                      to={`/doctor/schedules/${s._id}/patients`}
                      className="px-4 py-2 bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-colors"
                    >
                      View Roster
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalSchedules;
