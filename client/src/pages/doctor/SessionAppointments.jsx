import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  ChevronLeft,
  FileText,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export const SessionAppointments = () => {
  const { id } = useParams();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAppointments = async () => {
    try {
      const res = await api.get(`/schedules/${id}/appointments`);
      if (res.success && res.data) {
        setAppointments(res.data);
      }
    } catch (err) {
      toast.error('Failed to load session patient roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [id]);

  const handleMarkComplete = async (appointmentId, appointmentNo) => {
    setActionLoading(appointmentId);
    try {
      const res = await api.patch(`/appointments/${appointmentId}/complete`);
      if (res.success) {
        toast.success(`Appointment #${appointmentNo} marked as completed!`);
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to complete appointment.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center space-x-4">
        <Link
          to="/doctor/schedules"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Session Patient Roster</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage consultations and mark completed appointments as patients are seen.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Booked Patients ({appointments.length})
          </span>
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
            Ordered by Appointment Number
          </span>
        </div>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={User}
            title="No patients booked yet"
            description="There are currently no patient bookings registered for this session."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((appt) => {
              const isBooked = appt.status === 'booked';
              return (
                <div
                  key={appt._id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 text-brand-700 flex items-center justify-center font-black text-lg shrink-0">
                      #{appt.appointmentNo}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-slate-900 text-base">
                          {appt.patient?.name}
                        </h4>
                        <StatusBadge status={appt.status} />
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span className="flex items-center">
                          <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {appt.patient?.phone}
                        </span>
                        <span>{appt.patient?.email}</span>
                      </div>

                      {appt.patientNote && (
                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100">
                          "{appt.patientNote}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="self-end sm:self-auto">
                    {isBooked ? (
                      <button
                        disabled={actionLoading === appt._id}
                        onClick={() => handleMarkComplete(appt._id, appt.appointmentNo)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {actionLoading === appt._id ? 'Completing...' : 'Mark Completed'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic capitalize">
                        {appt.status}
                      </span>
                    )}
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

export default SessionAppointments;
