import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Building2,
  Users,
  Plus,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export const DoctorSchedules = () => {
  const { doctor } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [approvedHospitals, setApprovedHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Schedule form state
  const [formOpen, setFormOpen] = useState(false);
  const [hospitalId, setHospitalId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [maxPatients, setMaxPatients] = useState(20);
  const [submitting, setSubmitting] = useState(false);

  // Cancel Schedule modal state
  const [cancelModal, setCancelModal] = useState({ open: false, schedule: null, cancelling: false });

  const fetchData = async () => {
    try {
      const [schedRes, hospRes] = await Promise.all([
        api.get('/schedules/mine'),
        api.get('/doctors/me/hospitals'),
      ]);

      if (schedRes.success) setSchedules(schedRes.data || []);
      if (hospRes.success) {
        // Business Rule 2: Filter strictly to approved hospitals only
        const approved = (hospRes.data || [])
          .filter((item) => item.status === 'approved')
          .map((item) => item.hospital)
          .filter(Boolean);

        setApprovedHospitals(approved);
        if (approved.length > 0) setHospitalId(approved[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load doctor schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSchedule = async (e) => {
    e.preventDefault();

    if (!hospitalId || !date || !startTime || !endTime) {
      toast.error('Please fill in all schedule details.');
      return;
    }

    if (startTime >= endTime) {
      toast.error('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/schedules/mine', {
        hospitalId,
        date,
        startTime,
        endTime,
        maxPatients: Number(maxPatients),
      });

      if (res.success) {
        toast.success(res.message || 'Schedule created successfully!');
        setFormOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancelSchedule = async () => {
    if (!cancelModal.schedule) return;
    setCancelModal((prev) => ({ ...prev, cancelling: true }));

    try {
      const res = await api.patch(`/schedules/${cancelModal.schedule._id}/cancel`);
      toast.success(res.message || 'Schedule cancelled.');
      setCancelModal({ open: false, schedule: null, cancelling: false });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel schedule.');
      setCancelModal((prev) => ({ ...prev, cancelling: false }));
    }
  };

  const isApprovedDoctor = doctor?.approvalStatus === 'approved';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Channeling Schedules</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and manage upcoming channeling sessions at your approved hospitals.
          </p>
        </div>

        {isApprovedDoctor ? (
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{formOpen ? 'Close Form' : 'New Channeling Session'}</span>
          </button>
        ) : (
          <div className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
            Account Pending Admin Approval
          </div>
        )}
      </div>

      {/* Schedule Creation Card */}
      {formOpen && isApprovedDoctor && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-200 shadow-xl shadow-brand-900/5 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-brand-600" /> Schedule New Channeling Session
            </h3>
            <span className="text-xs text-slate-400">Enforces zero overlapping session rules</span>
          </div>

          {approvedHospitals.length === 0 ? (
            <div className="p-4 bg-amber-50 rounded-2xl text-xs text-amber-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                You do not have any approved hospital affiliations yet. Please visit{' '}
                <Link to="/doctor/hospitals" className="font-bold underline text-amber-900">
                  Hospital Affiliations
                </Link>{' '}
                to request links before scheduling sessions.
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Approved Hospital *
                  </label>
                  <select
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {approvedHospitals.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name} ({h.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Time Window (Start - End) *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Patient Capacity (1-100) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={maxPatients}
                    onChange={(e) => setMaxPatients(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Verifying & Creating...' : 'Publish Session'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Schedules List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-extrabold text-slate-900 text-lg">My Channeling Sessions ({schedules.length})</h3>

        {schedules.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No schedules created"
            description="You have not created any channeling sessions yet. Click New Channeling Session above to get started."
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

                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="text-slate-700">{s.hospital?.name}</strong>
                      <span>•</span>
                      <span>{s.hospital?.city}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-xs font-bold text-brand-700 block">
                        {s.bookedCount} / {s.maxPatients} Patients Booked
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {remaining} seat{remaining === 1 ? '' : 's'} remaining
                      </span>
                    </div>

                    <Link
                      to={`/doctor/schedules/${s._id}/patients`}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                    >
                      Patient Roster
                    </Link>

                    {s.status === 'active' && (
                      <button
                        onClick={() => setCancelModal({ open: true, schedule: s, cancelling: false })}
                        className="px-3 py-2 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
                      >
                        Cancel Session
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Schedule Cascade Warning Modal */}
      {cancelModal.open && cancelModal.schedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Cancel Entire Session?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Cancelling this schedule will immediately cancel all{' '}
                <strong>{cancelModal.schedule.bookedCount} active patient bookings</strong> and send
                automated cancellation notices to all registered patients.
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                disabled={cancelModal.cancelling}
                onClick={() => setCancelModal({ open: false, schedule: null, cancelling: false })}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Keep Session
              </button>
              <button
                type="button"
                disabled={cancelModal.cancelling}
                onClick={handleConfirmCancelSchedule}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                {cancelModal.cancelling ? 'Cancelling...' : 'Confirm Cascade Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSchedules;
