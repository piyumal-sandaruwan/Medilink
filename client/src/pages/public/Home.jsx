import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  Building2,
  Stethoscope,
  Heart,
  Activity,
  Brain,
  Baby,
  Bone,
  Eye,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../../api/client.js';

export const Home = () => {
  const navigate = useNavigate();
  const [specializations, setSpecializations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [searchForm, setSearchForm] = useState({
    name: '',
    specialization: '',
    hospital: '',
    date: '',
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [specsRes, hospsRes] = await Promise.all([
          api.get('/specializations'),
          api.get('/hospitals'),
        ]);
        if (specsRes.success) setSpecializations(specsRes.data || []);
        if (hospsRes.success) setHospitals(hospsRes.data || []);
      } catch (err) {
        console.error('Error fetching home metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchForm.name.trim()) params.set('name', searchForm.name.trim());
    if (searchForm.specialization) params.set('specialization', searchForm.specialization);
    if (searchForm.hospital) params.set('hospital', searchForm.hospital);
    if (searchForm.date) params.set('date', searchForm.date);

    navigate(`/doctors?${params.toString()}`);
  };

  const handleSpecCardClick = (specName) => {
    navigate(`/doctors?specialization=${encodeURIComponent(specName)}`);
  };

  const popularSpecialties = [
    { name: 'Cardiology', icon: Heart, desc: 'Heart care & coronary specialists' },
    { name: 'Dermatology', icon: Sparkles, desc: 'Skin, hair & allergy specialists' },
    { name: 'Neurology', icon: Brain, desc: 'Brain, spine & nerve care' },
    { name: 'Pediatrics', icon: Baby, desc: 'Child health & newborn care' },
    { name: 'Orthopedics', icon: Bone, desc: 'Bones, joints & sports medicine' },
    { name: 'Ophthalmology', icon: Eye, desc: 'Eye surgery & vision correction' },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-brand-50/70 via-white to-slate-50 pt-16 pb-24 overflow-hidden border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-800 tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 mr-1 text-brand-600" /> Sri Lanka's Verified Channeling Network
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Book Your Specialist Doctor <span className="text-brand-600">Without The Wait</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Find and channel certified consultants across premier Sri Lankan hospitals like Asiri,
              Lanka Hospitals, Nawaloka, and Durdans with live seat counts.
            </p>
          </div>

          {/* Search Box Card */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-8 shadow-xl shadow-brand-900/5 border border-slate-200/80">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Doctor Name Search */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Doctor Name
                  </label>
                  <div className="relative">
                    <Stethoscope className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Dr. Senanayake"
                      value={searchForm.name}
                      onChange={(e) => setSearchForm({ ...searchForm, name: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Specialization Dropdown */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Specialization
                  </label>
                  <div className="relative">
                    <Activity className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={searchForm.specialization}
                      onChange={(e) => setSearchForm({ ...searchForm, specialization: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-slate-700"
                    >
                      <option value="">Any Specialization</option>
                      {specializations.map((s) => (
                        <option key={s._id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hospital Dropdown */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Hospital
                  </label>
                  <div className="relative">
                    <Building2 className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={searchForm.hospital}
                      onChange={(e) => setSearchForm({ ...searchForm, hospital: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-slate-700"
                    >
                      <option value="">Any Hospital</option>
                      {hospitals.map((h) => (
                        <option key={h._id} value={h._id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Channeling Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={searchForm.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSearchForm({ ...searchForm, date: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  <Search className="w-5 h-5" />
                  <span>Search Sessions</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Stats Banner */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-center">
            <div className="p-4 bg-white/60 rounded-xl border border-slate-200">
              <div className="text-2xl font-black text-brand-700">10+</div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Specialties</div>
            </div>
            <div className="p-4 bg-white/60 rounded-xl border border-slate-200">
              <div className="text-2xl font-black text-brand-700">8</div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Top Hospitals</div>
            </div>
            <div className="p-4 bg-white/60 rounded-xl border border-slate-200">
              <div className="text-2xl font-black text-brand-700">100%</div>
              <div className="text-xs text-slate-500 font-semibold uppercase">SLMC Verified</div>
            </div>
            <div className="p-4 bg-white/60 rounded-xl border border-slate-200">
              <div className="text-2xl font-black text-brand-700">Race-Safe</div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Zero Overbooking</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Specialties Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Find By Discipline
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">Popular Medical Specialties</h2>
          </div>
          <button
            onClick={() => navigate('/doctors')}
            className="text-sm font-bold text-brand-700 hover:text-brand-800 transition-colors mt-2 md:mt-0"
          >
            Explore all specialties →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularSpecialties.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                onClick={() => handleSpecCardClick(item.name)}
                className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-brand-500 hover:shadow-lg hover:shadow-brand-600/10 transition-all cursor-pointer flex items-start space-x-4"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Seamless Patient Experience
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-2">How MediLink Works</h2>
            <p className="text-sm text-slate-400 mt-2">
              Book your doctor channeling in three simple steps without queuing at counters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-black flex items-center justify-center mx-auto mb-4 text-base">
                1
              </div>
              <h3 className="text-lg font-bold mb-2">Search Specialist</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter by specialty, doctor name, hospital, or desired date to browse available channeling sessions.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-black flex items-center justify-center mx-auto mb-4 text-base">
                2
              </div>
              <h3 className="text-lg font-bold mb-2">Select Session & Book</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose an active session with open capacity. Our race-safe atomic booking guarantees your unique appointment number.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-black flex items-center justify-center mx-auto mb-4 text-base">
                3
              </div>
              <h3 className="text-lg font-bold mb-2">Simulate & Confirm</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete the simulated card payment to receive instant booking confirmation and email receipt.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
