import React from 'react';
import { HeartPulse, PhoneCall, ShieldAlert, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg">
                <HeartPulse className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Medi<span className="text-brand-400">Link</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              MediLink is Sri Lanka's leading digital doctor channeling platform, connecting patients
              with qualified medical specialists across the island's premier private hospitals.
            </p>
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span className="inline-flex items-center text-emerald-400 font-semibold">
                <Award className="w-4 h-4 mr-1" /> SLMC Verified Doctors
              </span>
              <span>•</span>
              <span>Doc990 Alternative</span>
            </div>
          </div>

          {/* Emergency Hotline Alert */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 lg:col-span-1">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Medical Emergency?</span>
            </div>
            <div className="text-2xl font-black text-white flex items-center mb-1">
              <PhoneCall className="w-5 h-5 mr-2 text-rose-400" />
              <span>1990</span>
            </div>
            <p className="text-xs text-slate-400 leading-tight">
              Suwa Seriya Free Emergency Ambulance Service across Sri Lanka.
            </p>
          </div>

          {/* Popular Hospitals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Partner Hospitals
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Asiri Central Hospital</li>
              <li>Lanka Hospitals Colombo</li>
              <li>Nawaloka Hospital</li>
              <li>Durdans Hospital</li>
              <li>Kings Hospital Colombo</li>
              <li>Hemas Hospital Wattala</li>
              <li>Ninewells Channeling Centre</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/doctors" className="hover:text-brand-400 transition-colors">
                  Find a Doctor
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-brand-400 transition-colors">
                  Patient Sign Up
                </Link>
              </li>
              <li>
                <Link to="/doctor-signup" className="hover:text-brand-400 transition-colors">
                  Doctor Join Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-400 transition-colors">
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} MediLink Sri Lanka. Developed for internship demonstration.</p>
          <p className="text-slate-400">
            Certified SLMC practitioners • Simulated payment gateway • Privacy protected
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
