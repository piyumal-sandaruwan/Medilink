import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Stethoscope, Building2, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export const AllAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/appointments?status=${statusFilter}`);
      if (res.success && res.data) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Platform Channeling Log
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-0.5">Platform-Wide Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Global log of all patient channelings, statuses, and consulting hospitals.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {['all', 'booked', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-extrabold text-slate-900 text-lg capitalize">
          {statusFilter} Bookings ({appointments.length})
        </h3>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments found"
            description="There are no records matching your selected status filter."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((appt) => {
              const { schedule, patient, appointmentNo, status } = appt;
              const doctor = schedule?.doctor;
              const hospital = schedule?.hospital;

              return (
                <div
                  key={appt._id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-black text-lg shrink-0">
                      #{appointmentNo}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-slate-900 text-base">
                          {patient?.name}
                        </h4>
                        <span className="text-xs text-slate-500">({patient?.phone})</span>
                        <StatusBadge status={status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center font-semibold text-slate-800">
                          <Stethoscope className="w-3.5 h-3.5 mr-1 text-brand-600" />
                          {doctor?.user?.name} ({doctor?.specialization?.name})
                        </span>
                        <span className="flex items-center">
                          <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {hospital?.name}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {new Date(schedule?.date).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          at {schedule?.startTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 font-mono self-end md:self-center">
                    ID: {appt._id.slice(-8)}
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

export default AllAppointments;
