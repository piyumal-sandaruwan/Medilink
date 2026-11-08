import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, Mail, Lock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      toast.success(res.message || 'Logged in successfully!');

      const userRole = res.data.user.role;
      if (from) {
        navigate(from, { replace: true });
      } else if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'doctor') {
        navigate('/doctor/dashboard', { replace: true });
      } else if (userRole === 'hospital_admin') {
        navigate('/hospital/dashboard', { replace: true });
      } else {
        navigate('/patient/appointments', { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for internship demo presentation
  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-600/30">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Welcome Back</h2>
          <p className="text-sm text-slate-500">Sign in to manage your appointments and channeling</p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-brand-900/5 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Internship Demo Quick Fill Helper */}
          <div className="pt-4 border-t border-slate-100">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
              <UserCheck className="w-3.5 h-3.5 mr-1 text-brand-600" /> Demo Quick-Logins (Internship Demo)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@medilink.lk', 'Admin@123456')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 text-left font-medium"
              >
                <strong>Admin</strong>
                <span className="block text-[10px] text-slate-400">Platform Head</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('hospital.admin@medilink.lk', 'HospAdmin@123')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 text-left font-medium"
              >
                <strong>Hospital Admin</strong>
                <span className="block text-[10px] text-slate-400">Asiri Central</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('anura.senanayake@medilink.lk', 'Doctor@123')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 text-left font-medium"
              >
                <strong>Dr. Senanayake</strong>
                <span className="block text-[10px] text-slate-400">Cardiologist</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('patient1@medilink.lk', 'Patient@123')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 text-left font-medium"
              >
                <strong>Demo Patient</strong>
                <span className="block text-[10px] text-slate-400">Kasun Perera</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 space-y-1">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-600 font-bold hover:underline">
                Register as Patient
              </Link>
            </p>
            <p>
              Are you a licensed doctor?{' '}
              <Link to="/doctor-signup" className="text-brand-600 font-bold hover:underline">
                Apply for Doctor Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
