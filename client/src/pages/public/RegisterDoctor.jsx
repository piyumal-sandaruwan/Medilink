import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  User,
  Mail,
  Lock,
  Phone,
  Award,
  DollarSign,
  FileText,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const RegisterDoctor = () => {
  const { registerDoctor } = useAuth();
  const navigate = useNavigate();

  const [specializations, setSpecializations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    slmcNo: '',
    experienceYears: '',
    channelingFee: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const res = await api.get('/specializations');
        if (res.success && res.data) {
          setSpecializations(res.data);
          if (res.data.length > 0) {
            setFormData((prev) => ({ ...prev, specialization: res.data[0]._id }));
          }
        }
      } catch (err) {
        console.error('Failed to load specializations:', err);
      }
    };
    fetchSpecializations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.phone ||
      !formData.specialization ||
      !formData.slmcNo ||
      formData.experienceYears === '' ||
      formData.channelingFee === ''
    ) {
      toast.error('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerDoctor({
        ...formData,
        experienceYears: Number(formData.experienceYears),
        channelingFee: Number(formData.channelingFee),
      });

      toast.success(
        res.message || 'Registration submitted! Your profile is pending verification.',
        { duration: 6000 }
      );
      navigate('/doctor/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Doctor registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center space-y-2 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-600/30">
          <Stethoscope className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Doctor Registration Portal</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Join MediLink's island-wide channeling network. Verified SLMC practitioners only.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-brand-900/5 space-y-6">
        {/* Verification Notice */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start space-x-3 text-xs text-amber-800">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Important Notice on Approval:</strong>
            Per Sri Lankan regulations, your account will be created with status <em>Pending</em>.
            Our administrative team verifies all SLMC credentials before your profile appears in
            public searches or can publish channeling schedules.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Account Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              1. Account Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Doctor Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Kasun Bandara"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="doctor@hospital.lk"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mobile Phone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="0771234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Account Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Credentials */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              2. Medical Licensing & Practice
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Specialization *</label>
                <select
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select Specialization</option>
                  {specializations.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  SLMC Registration No. *
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. SLMC-12345"
                    value={formData.slmcNo}
                    onChange={(e) => setFormData({ ...formData, slmcNo: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 10"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Standard Channeling Fee (LKR) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    placeholder="e.g. 3000"
                    value={formData.channelingFee}
                    onChange={(e) => setFormData({ ...formData, channelingFee: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Professional Bio / Clinical Summary
                </label>
                <textarea
                  rows="3"
                  placeholder="Brief overview of clinical focus, memberships and hospital appointments..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                ></textarea>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Submitting Application...' : 'Submit Doctor Application'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already registered as a practitioner?{' '}
          <Link to="/login" className="text-brand-600 font-bold hover:underline">
            Doctor Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterDoctor;
