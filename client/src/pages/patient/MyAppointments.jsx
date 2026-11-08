import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  XCircle,
  CreditCard,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [cancelModal, setCancelModal] = useState({ open: false, appointment: null, cancelling: false });

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/mine');
      if (res.success && res.data) {
        setAppointments(res.data);
      }
    } catch (err) {
      toast.error('Failed to load your appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Helper to check 2-hour rule
  const isCancellable = (scheduleDate, startTime) => {
    if (!scheduleDate || !startTime) return false;
    const sessionStart = new Date(scheduleDate);
    const [h, m] = startTime.split(':').map((v) => parseInt(v, 10));
    sessionStart.setHours(h, m, 0, 0);

    const twoHoursBefore = new Date(sessionStart.getTime() - 2 * 60 * 60 * 1000);
    return new Date() <= twoHoursBefore;
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.appointment) return;
    setCancelModal((prev) => ({ ...prev, cancelling: true }));

    try {
      const res = await api.patch(`/appointments/${cancelModal.appointment._id}/cancel`);
      toast.success(res.message || 'Appointment cancelled successfully.');
      setCancelModal({ open: false, appointment: null, cancelling: false });
      fetchAppointments();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel appointment.');
      setCancelModal((prev) => ({ ...prev, cancelling: false }));
    }
  };

  const now = new Date();
  const upcomingList = appointments.filter((a) => {
    if (a.status !== 'booked') return false;
    const sessionDate = new Date(a.schedule?.date);
    const [h, m] = (a.schedule?.startTime || '00:00').split(':').map((v) => parseInt(v, 10));
    sessionDate.setHours(h, m, 0, 0);
    return sessionDate >= now;
  });

  const pastList = appointments.filter((a) => {
    if (a.status !== 'booked') return true;
    const sessionDate = new Date(a.schedule?.date);
    const [h, m] = (a.schedule?.startTime || '00:00').split(':').map((v) => parseInt(v, 10));
    sessionDate.setHours(h, m, 0, 0);
    return sessionDate < now;
  });

  const displayedList = activeTab === 'upcoming' ? upcomingList : pastList;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">My Channeling Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and manage your upcoming doctor channeling sessions and consultation history.
          </p>
        </div>
        <Link
          to="/doctors"
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow transition-colors inline-block text-center"
        >
          Book New Channeling
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-8">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'upcoming'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Upcoming Sessions</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-700 font-extrabold">
            {upcomingList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'past'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Past & Cancelled</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-semibold">
            {pastList.length}
          </span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : displayedList.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={activeTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          description={
            activeTab === 'upcoming'
              ? 'You do not have any active appointments booked right now.'
              : 'Your past and cancelled appointment history will be logged here.'
          }
          action={
            activeTab === 'upcoming' && (
              <Link
                to="/doctors"
                className="px-4 py-2 bg-brand-600 text-white font-bold text-sm rounded-xl shadow"
              >
                Find & Channel Doctor
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {displayedList.map((appt) => {
            const { schedule, payment, appointmentNo, status } = appt;
            const doctor = schedule?.doctor;
            const hospital = schedule?.hospital;
            const canCancel =
              status === 'booked' && isCancellable(schedule?.date, schedule?.startTime);

            return (
              <div
                key={appt._id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Info */}
                <div className="flex items-start space-x-4">
                  <div className="text-center px-4 py-3 bg-brand-50/80 rounded-2xl border border-brand-100 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                      Appt No
                    </span>
                    <span className="text-2xl font-black text-brand-800 block">
                      #{appointmentNo}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-lg">
                        {doctor?.user?.name}
                      </h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 bg-brand-50 text-brand-700 rounded-full">
                        {doctor?.specialization?.name}
                      </span>
                      <StatusBadge status={status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                      <span className="flex items-center font-medium text-slate-700">
                        <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {hospital?.name} ({hospital?.city})
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {new Date(schedule?.date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {schedule?.startTime} - {schedule?.endTime}
                      </span>
                    </div>

                    {appt.patientNote && (
                      <p className="text-xs text-slate-500 italic pt-1">
                        Note: "{appt.patientNote}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Payment & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 self-end md:self-center">
                  {payment && (
                    <div className="text-right sm:pr-4 sm:border-r border-slate-100">
                      <div className="text-xs text-slate-400 uppercase font-semibold">
                        Fee: LKR {payment.amount?.toLocaleString()}
                      </div>
                      <StatusBadge status={payment.status} />
                    </div>
                  )}

                  {payment?.status === 'pending' && status === 'booked' && (
                    <Link
                      to={`/patient/checkout/${appt._id}`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Complete Payment</span>
                    </Link>
                  )}

                  {status === 'booked' && (
                    <div>
                      {canCancel ? (
                        <button
                          onClick={() => setCancelModal({ open: true, appointment: appt, cancelling: false })}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
                        >
                          Cancel Booking
                        </button>
                      ) : (
                        <div className="text-[11px] text-slate-400 font-medium italic">
                          Cancellation closed (&lt; 2 hrs)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModal.open && cancelModal.appointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Cancel Appointment?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to cancel your appointment #{cancelModal.appointment.appointmentNo} with{' '}
                <strong>{cancelModal.appointment.schedule?.doctor?.user?.name}</strong>?
                This action is irreversible and the appointment number will not be reused.
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                disabled={cancelModal.cancelling}
                onClick={() => setCancelModal({ open: false, appointment: null, cancelling: false })}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelModal.cancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                {cancelModal.cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
