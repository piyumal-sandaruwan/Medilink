import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HeartPulse,
  Menu,
  X,
  User,
  LogOut,
  Calendar,
  Building2,
  Stethoscope,
  ShieldCheck,
  Search,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isPatient, isDoctor, isHospitalAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMenu = () => setMobileMenuOpen(false);
  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" onClick={closeMenu} className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors">
                Medi<span className="text-brand-600">Link</span>
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase -mt-1">
                Sri Lanka
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/doctors"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                isActive('/doctors')
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Find Doctors</span>
            </Link>

            {/* Patient Links */}
            {isPatient && (
              <>
                <Link
                  to="/patient/appointments"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/patient/appointments')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>My Appointments</span>
                </Link>
                <Link
                  to="/patient/profile"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/patient/profile')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
              </>
            )}

            {/* Doctor Links */}
            {isDoctor && (
              <>
                <Link
                  to="/doctor/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/doctor/dashboard')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/doctor/schedules"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/doctor/schedules')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedules</span>
                </Link>
                <Link
                  to="/doctor/hospitals"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/doctor/hospitals')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Affiliations</span>
                </Link>
                <Link
                  to="/doctor/profile"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/doctor/profile')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Profile Editor</span>
                </Link>
              </>
            )}

            {/* Hospital Admin Links */}
            {isHospitalAdmin && (
              <>
                <Link
                  to="/hospital/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/hospital/dashboard')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Affiliation Requests</span>
                </Link>
                <Link
                  to="/hospital/schedules"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/hospital/schedules')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Hospital Channelings</span>
                </Link>
              </>
            )}

            {/* Admin Links */}
            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/admin')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Admin Hub</span>
                </Link>
                <Link
                  to="/admin/doctors"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/admin/doctors')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approvals</span>
                </Link>
                <Link
                  to="/admin/hospitals"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/admin/hospitals')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Facilities</span>
                </Link>
                <Link
                  to="/admin/users"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/admin/users')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
                  <span className="inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/doctor-signup"
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
                >
                  Doctor Sign Up
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-600/30 transition-all hover:shadow"
                >
                  Book Appointment
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {isAuthenticated && (
            <div className="p-3 bg-brand-50 rounded-xl mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                <span className="text-xs font-semibold uppercase text-brand-700">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-600 font-semibold px-2 py-1 bg-white rounded border border-rose-200"
              >
                Sign Out
              </button>
            </div>
          )}

          <div className="space-y-1">
            <Link
              to="/doctors"
              onClick={closeMenu}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Find Doctors
            </Link>

            {isPatient && (
              <>
                <Link
                  to="/patient/appointments"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  My Appointments
                </Link>
                <Link
                  to="/patient/profile"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Profile
                </Link>
              </>
            )}

            {isDoctor && (
              <>
                <Link
                  to="/doctor/dashboard"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Doctor Dashboard
                </Link>
                <Link
                  to="/doctor/schedules"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  My Schedules
                </Link>
                <Link
                  to="/doctor/hospitals"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hospital Affiliations
                </Link>
                <Link
                  to="/doctor/profile"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Profile Editor
                </Link>
              </>
            )}

            {isHospitalAdmin && (
              <>
                <Link
                  to="/hospital/dashboard"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Doctor Affiliations
                </Link>
                <Link
                  to="/hospital/schedules"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hospital Channelings
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Admin Hub
                </Link>
                <Link
                  to="/admin/doctors"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Doctor Approvals
                </Link>
                <Link
                  to="/admin/hospitals"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hospital Facilities
                </Link>
                <Link
                  to="/admin/users"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  User Directory
                </Link>
              </>
            )}

            {!isAuthenticated && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block text-center py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-800"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="block text-center py-2.5 rounded-lg text-sm font-semibold bg-brand-600 text-white"
                >
                  Patient Registration
                </Link>
                <Link
                  to="/doctor-signup"
                  onClick={closeMenu}
                  className="block text-center py-2.5 rounded-lg text-sm font-semibold text-brand-700 border border-brand-300"
                >
                  Doctor Registration
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
