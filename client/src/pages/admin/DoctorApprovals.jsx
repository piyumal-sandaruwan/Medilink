import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Award,
  Filter,
  User,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export const DoctorApprovals = () => {
  const [doctors, setDoctors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Document preview modal state
  const [docModal, setDocModal] = useState({ open: false, url: null, title: '' });

  // Rejection modal state
  const [rejectModal, setRejectModal] = useState({ open: false, doctor: null, reason: '' });

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/doctors?status=${statusFilter}`);
      if (res.success && res.data) {
        setDoctors(res.data.doctors || []);
      }
    } catch (err) {
      toast.error('Failed to load doctors list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [statusFilter]);

  const handleApprove = async (doctor) => {
    setActionLoading(doctor._id);
    try {
      const res = await api.patch(`/admin/doctors/${doctor._id}/approval`, {
        approvalStatus: 'approved',
      });
      if (res.success) {
        toast.success(res.message || 'Doctor approved successfully!');
        fetchDoctors();
      }
    } catch (err) {
      toast.error(err.message || 'Approval failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.doctor) return;
    setActionLoading(rejectModal.doctor._id);
    try {
      const res = await api.patch(`/admin/doctors/${rejectModal.doctor._id}/approval`, {
        approvalStatus: 'rejected',
        rejectionReason: rejectModal.reason || 'Credentials could not be verified with SLMC',
      });
      if (res.success) {
        toast.success(res.message || 'Doctor application rejected.');
        setRejectModal({ open: false, doctor: null, reason: '' });
        fetchDoctors();
      }
    } catch (err) {
      toast.error(err.message || 'Rejection failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDocument = async (doctor) => {
    if (!doctor.slmcDocument) {
      toast.error('No verification document attached.');
      return;
    }

    try {
      // Check if signed URL is already populated or request from endpoint
      const viewRes = await api.get(`/uploads/view?key=${encodeURIComponent(doctor.slmcDocument)}`);
      if (viewRes.success && viewRes.data?.viewUrl) {
        setDocModal({
          open: true,
          url: viewRes.data.viewUrl,
          title: `SLMC Document - ${doctor.user?.name} (${doctor.slmcNo})`,
        });
      } else {
        toast.error('Document could not be retrieved from S3 (or S3 is not configured).');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch document link.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Medical Council Compliance
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-0.5">Doctor Verification & Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review SLMC credentials and approve doctors to participate in channeling.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {['pending', 'approved', 'rejected', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-extrabold text-slate-900 text-lg capitalize">
          {statusFilter} Applications ({doctors.length})
        </h3>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : doctors.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title={`No ${statusFilter} doctors`}
            description={`There are currently no doctor profiles with status '${statusFilter}'.`}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {doctors.map((doctor) => {
              const isPending = doctor.approvalStatus === 'pending';
              return (
                <div
                  key={doctor._id}
                  className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={
                        doctor.profileImageUrl ||
                        doctor.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          doctor.user?.name || 'Doctor'
                        )}&background=0d9488&color=fff&size=120`
                      }
                      alt={doctor.user?.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm shrink-0"
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-base">
                          {doctor.user?.name}
                        </h4>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700">
                          {doctor.specialization?.name}
                        </span>
                        <StatusBadge status={doctor.approvalStatus} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>SLMC: <strong className="text-slate-800 font-mono">{doctor.slmcNo}</strong></span>
                        <span>Experience: {doctor.experienceYears} yrs</span>
                        <span>Fee: LKR {doctor.channelingFee?.toLocaleString()}</span>
                        <span>Phone: {doctor.user?.phone}</span>
                      </div>

                      {doctor.bio && (
                        <p className="text-xs text-slate-500 line-clamp-1 pt-0.5">{doctor.bio}</p>
                      )}

                      {doctor.rejectionReason && doctor.approvalStatus === 'rejected' && (
                        <p className="text-xs text-rose-600 font-semibold pt-1">
                          Rejection Reason: "{doctor.rejectionReason}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end lg:self-center shrink-0">
                    {/* View SLMC Document Button */}
                    {doctor.slmcDocument ? (
                      <button
                        onClick={() => handleViewDocument(doctor)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-600" />
                        <span>SLMC Document</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No doc attached</span>
                    )}

                    {isPending && (
                      <>
                        <button
                          disabled={actionLoading === doctor._id}
                          onClick={() => handleApprove(doctor)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-1 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          disabled={actionLoading === doctor._id}
                          onClick={() => setRejectModal({ open: true, doctor, reason: '' })}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center space-x-1 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {docModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">{docModal.title}</h3>
              <button
                onClick={() => setDocModal({ open: false, url: null, title: '' })}
                className="text-xs font-bold text-slate-400 hover:text-slate-800"
              >
                Close ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2 min-h-[300px] flex items-center justify-center">
              {docModal.url?.endsWith('.pdf') ? (
                <iframe src={docModal.url} title="Document PDF" className="w-full h-[500px]" />
              ) : (
                <img src={docModal.url} alt="SLMC License" className="max-h-[500px] object-contain rounded-lg" />
              )}
            </div>
            <div className="text-right">
              <a
                href={docModal.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs font-bold text-brand-600 hover:underline"
              >
                Open in new tab <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModal.open && rejectModal.doctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4">
            <h3 className="font-black text-slate-900 text-xl">Reject Doctor Application</h3>
            <p className="text-xs text-slate-500">
              Please specify the reason for rejecting Dr. {rejectModal.doctor.user?.name}'s application:
            </p>
            <textarea
              rows="3"
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="e.g. SLMC registration number could not be validated against official register."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            ></textarea>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setRejectModal({ open: false, doctor: null, reason: '' })}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorApprovals;
