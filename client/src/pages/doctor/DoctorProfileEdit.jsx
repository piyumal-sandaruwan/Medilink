import React, { useState, useEffect } from 'react';
import { Stethoscope, DollarSign, Upload, FileText, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const DoctorProfileEdit = () => {
  const { doctor, refreshMe } = useAuth();
  const [bio, setBio] = useState('');
  const [channelingFee, setChannelingFee] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [slmcDocument, setSlmcDocument] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (doctor) {
      setBio(doctor.bio || '');
      setChannelingFee(doctor.channelingFee?.toString() || '');
      setProfileImage(doctor.profileImage || '');
      setSlmcDocument(doctor.slmcDocument || '');
    }
  }, [doctor]);

  // Direct S3 Upload handler using presigned URL
  const handleFileUpload = async (e, purpose) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds maximum limit of 5 MB.');
      return;
    }

    const isPhoto = purpose === 'doctor-photo';
    if (isPhoto) setUploadingPhoto(true);
    else setUploadingDoc(true);

    try {
      const presignRes = await api.post('/uploads/presign', {
        purpose,
        contentType: file.type,
        size: file.size,
      });

      if (presignRes.success && presignRes.data?.configured && presignRes.data?.uploadUrl) {
        // Upload directly to S3 via presigned PUT URL
        await axios.put(presignRes.data.uploadUrl, file, {
          headers: { 'Content-Type': file.type },
        });

        if (isPhoto) {
          setProfileImage(presignRes.data.key);
          toast.success('Photo uploaded to S3 storage!');
        } else {
          setSlmcDocument(presignRes.data.key);
          toast.success('SLMC document uploaded to S3 storage!');
        }
      } else {
        // S3 is not configured on this server: simulate upload safely
        toast('S3 storage is not configured. Simulating asset upload.', { icon: 'ℹ️' });
        const simulatedKey = `${purpose}/${Date.now()}-${file.name}`;
        if (isPhoto) setProfileImage(simulatedKey);
        else setSlmcDocument(simulatedKey);
      }
    } catch (err) {
      toast.error(err.message || 'File upload failed.');
    } finally {
      if (isPhoto) setUploadingPhoto(false);
      else setUploadingDoc(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/doctors/me', {
        bio,
        channelingFee: Number(channelingFee),
        profileImage,
        slmcDocument,
      });

      if (res.success) {
        toast.success(res.message || 'Doctor profile updated successfully!');
        await refreshMe();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Doctor Profile Editor</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update your public biography, channeling fee, profile image, and verification documents.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Read-only verification info */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-bold tracking-wider">Specialization</span>
              <strong className="text-slate-800 text-sm font-bold">
                {doctor?.specialization?.name || 'General'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold tracking-wider">SLMC Number</span>
              <strong className="text-slate-800 text-sm font-mono font-bold">
                {doctor?.slmcNo || 'N/A'}
              </strong>
            </div>
          </div>

          {/* Channeling Fee */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Standard Channeling Fee (LKR)
            </label>
            <div className="relative">
              <DollarSign className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min="0"
                step="100"
                required
                value={channelingFee}
                onChange={(e) => setChannelingFee(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Biography */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Professional Biography
            </label>
            <textarea
              rows="4"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Detail your clinical experience, special procedures, and hospital appointments..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            ></textarea>
          </div>

          {/* Profile Photo Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Profile Photo (S3 / Image URL)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileUpload(e, 'doctor-photo')}
                className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
              />
              {uploadingPhoto && <span className="text-xs text-brand-600 animate-pulse">Uploading...</span>}
            </div>
            {profileImage && (
              <p className="text-[11px] text-slate-500 font-mono truncate">
                Current Asset: {profileImage}
              </p>
            )}
          </div>

          {/* SLMC Verification Document */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              SLMC Verification Document (PDF / Image)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => handleFileUpload(e, 'slmc-document')}
                className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
              {uploadingDoc && <span className="text-xs text-brand-600 animate-pulse">Uploading...</span>}
            </div>
            {slmcDocument && (
              <p className="text-[11px] text-emerald-600 font-mono flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Document attached: {slmcDocument}
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorProfileEdit;
