import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  ShieldCheck,
  Award,
  ChevronRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ProfileSkeleton } from '../../components/LoadingSkeleton.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

export const DoctorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isPatient } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState({ open: false, schedule: null, note: '', submitting: false });

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/doctors/${id}`);
        if (res.success && res.data) {
          setDoctor(res.data);
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load doctor profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [id]);

  const handleOpenBooking = (schedule) => {
    if (!isAuthenticated) {
      toast('Please log in or create a patient account to book an appointment.', { icon: '🔒' });
      navigate('/login', { state: { from: { pathname: `/doctors/${id}` } } });
      return;
    }

    if (!isPatient) {
      toast.error('Only patient accounts can book appointments.');
      return;
    }

    setBookingModal({
      open: true,
      schedule,
      note: '',
      submitting: false,
    });
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingModal.schedule) return;

    setBookingModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await api.post('/appointments', {
        scheduleId: bookingModal.schedule._id,
        patientNote: bookingModal.note,
      });

      if (res.success && res.data) {
        toast.success(res.message || 'Appointment reserved!');
        // Navigate directly to simulated payment page
        navigate(`/patient/checkout/${res.data.appointment._id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Booking failed. Please try another slot.');
      setBookingModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  if (loading) return <div className="py-12"><ProfileSkeleton /></div>;
  if (!doctor) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <img
            src={
              doctor.profileImageUrl ||
              doctor.profileImage ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                doctor.user?.name || 'Doctor'
              )}&background=0d9488&color=fff&size=200`
            }
            alt={doctor.user?.name}
            className="w-32 h-32 rounded-3xl object-cover border-2 border-brand-100 shadow-md"
          />

          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">{doctor.user?.name}</h1>
                <p className="text-brand-700 font-bold text-base mt-0.5">
                  {doctor.specialization?.name}
                </p>
              </div>
              <div className="text-center md:text-right">
                <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Channeling Fee</span>
                <span className="text-2xl font-black text-brand-700">
                  LKR {doctor.channelingFee.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              <span className="inline-flex items-center text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> SLMC: {doctor.slmcNo}
              </span>
              <span className="inline-flex items-center text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                <Award className="w-3.5 h-3.5 mr-1 text-brand-600" /> {doctor.experienceYears} Years Experience
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed pt-2">
              {doctor.bio || 'Consultant specialist providing expert diagnosis and clinical care.'}
            </p>
          </div>
        </div>
      </div>

      {/* Hospital Affiliations */}
      {doctor.hospitals && doctor.hospitals.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-brand-600" /> Approved Hospital Affiliations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {doctor.hospitals.map((h) => (
              <div key={h._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm">{h.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{h.city}</p>
                <p className="text-[11px] text-slate-400 mt-1">{h.address}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Channeling Sessions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-brand-600" /> Upcoming Channeling Sessions
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose an active session below. Appointment numbers are assigned atomically on booking.
          </p>
        </div>

        {(!doctor.upcomingSchedules || doctor.upcomingSchedules.length === 0) ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No upcoming sessions currently scheduled for this doctor. Please check back soon.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {doctor.upcomingSchedules.map((session) => {
              const remaining = session.maxPatients - session.bookedCount;
              const isFull = remaining <= 0;
              const dateFormatted = new Date(session.date).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={session._id}
                  className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 text-base">{dateFormatted}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {session.startTime} - {session.endTime}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">{session.hospital?.name}</span>
                      <span>•</span>
                      <span>{session.hospital?.city}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div>
                      {isFull ? (
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                          Fully Booked
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          {remaining} of {session.maxPatients} seats left
                        </span>
                      )}
                    </div>

                    <button
                      disabled={isFull}
                      onClick={() => handleOpenBooking(session)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all ${
                        isFull
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20 hover:shadow'
                      }`}
                    >
                      {isFull ? 'Sold Out' : 'Book Session'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Reserve Appointment</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                Channel Dr. {doctor.user?.name}
              </h3>
            </div>

            <div className="p-4 bg-brand-50/70 rounded-2xl border border-brand-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <strong className="text-slate-800">
                  {new Date(bookingModal.schedule.date).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <strong className="text-slate-800">{bookingModal.schedule.startTime}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hospital:</span>
                <strong className="text-slate-800">{bookingModal.schedule.hospital?.name}</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-brand-200">
                <span className="text-slate-500">Total Fee:</span>
                <strong className="text-brand-800 font-extrabold text-sm">
                  LKR {doctor.channelingFee.toLocaleString()}
                </strong>
              </div>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Patient Note / Reason for Visit (Optional)
                </label>
                <textarea
                  rows="3"
                  maxLength="500"
                  placeholder="e.g. Mild headache and dizziness for past 3 days."
                  value={bookingModal.note}
                  onChange={(e) => setBookingModal({ ...bookingModal, note: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  disabled={bookingModal.submitting}
                  onClick={() => setBookingModal({ open: false, schedule: null, note: '', submitting: false })}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingModal.submitting}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-600/30 flex items-center justify-center space-x-2"
                >
                  {bookingModal.submitting ? 'Reserving...' : 'Reserve & Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDetail;
