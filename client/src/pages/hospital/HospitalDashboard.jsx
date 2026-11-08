import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, XCircle, Clock, Stethoscope, Award, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export const HospitalDashboard = () => {
  const { user, hospital } = useAuth();
  const [affiliations, setAffiliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAffiliations = async () => {
    try {
      const res = await api.get('/doctor-hospitals');
      if (res.success && res.data) {
        setAffiliations(res.data);
      }
    } catch (err) {
      toast.error('Failed to load doctor affiliation requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliations();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      const res = await api.patch(`/doctor-hospitals/${id}`, { status });
      if (res.success) {
        toast.success(res.message || `Affiliation ${status}!`);
        fetchAffiliations();
      }
    } catch (err) {
      toast.error(err.message || 'Status update failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const pending = affiliations.filter((a) => a.status === 'pending');
  const approved = affiliations.filter((a) => a.status === 'approved');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
          Hospital Administrator Portal
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
          {hospital?.name || 'Hospital'} Affiliation Requests
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review and approve specialist doctors requesting to conduct channeling sessions at your facility.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pending Review
          </span>
          <div className="text-3xl font-black text-amber-600 mt-1">{pending.length}</div>
          <p className="text-xs text-slate-500 mt-1">Awaiting approval action</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Approved Doctors
          </span>
          <div className="text-3xl font-black text-emerald-600 mt-1">{approved.length}</div>
          <p className="text-xs text-slate-500 mt-1">Currently affiliated specialists</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Facility Registration
          </span>
          <div className="text-xl font-bold text-slate-800 mt-2 font-mono">
            {hospital?.registrationNo || 'PV-DEMO'}
          </div>
          <p className="text-xs text-slate-500 mt-1">{hospital?.city || 'Sri Lanka'}</p>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-extrabold text-slate-900 text-lg">Doctor Applications & Requests</h3>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : affiliations.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No affiliation requests"
            description="There are currently no doctor affiliation requests logged for this hospital."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {affiliations.map((item) => {
              const doc = item.doctor;
              const isPending = item.status === 'pending';
              return (
                <div
                  key={item._id}
                  className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={
                        doc?.profileImageUrl ||
                        doc?.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          doc?.user?.name || 'Doctor'
                        )}&background=0d9488&color=fff&size=100`
                      }
                      alt={doc?.user?.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-slate-900 text-base">
                          {doc?.user?.name}
                        </h4>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                          {doc?.specialization?.name}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>SLMC: <strong className="text-slate-700">{doc?.slmcNo}</strong></span>
                        <span>Experience: {doc?.experienceYears} yrs</span>
                        <span>Fee: LKR {doc?.channelingFee?.toLocaleString()}</span>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center pt-0.5">
                        <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" /> {doc?.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    {isPending ? (
                      <>
                        <button
                          disabled={actionLoading === item._id}
                          onClick={() => handleUpdateStatus(item._id, 'approved')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-1 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve Link</span>
                        </button>
                        <button
                          disabled={actionLoading === item._id}
                          onClick={() => handleUpdateStatus(item._id, 'rejected')}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center space-x-1 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 italic">
                        Action completed
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

export default HospitalDashboard;
