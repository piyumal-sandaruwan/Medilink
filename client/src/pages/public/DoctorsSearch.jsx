import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  Building2,
  Stethoscope,
  Clock,
  Sparkles,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import api from '../../api/client.js';
import { CardSkeleton } from '../../components/LoadingSkeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export const DoctorsSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 9 });

  // Filters state from URL query params
  const [filterName, setFilterName] = useState(searchParams.get('name') || '');
  const [filterSpec, setFilterSpec] = useState(searchParams.get('specialization') || '');
  const [filterHospital, setFilterHospital] = useState(searchParams.get('hospital') || '');
  const [filterCity, setFilterCity] = useState(searchParams.get('city') || '');
  const [filterDate, setFilterDate] = useState(searchParams.get('date') || '');

  // Fetch Specializations & Hospitals metadata once
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
        console.error('Metadata fetch error:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Doctors whenever searchParams changes
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams(searchParams);
        if (!queryParams.has('limit')) queryParams.set('limit', '9');

        const res = await api.get(`/doctors?${queryParams.toString()}`);
        if (res.success && res.data) {
          setDoctors(res.data.doctors || []);
          setPagination(res.data.pagination || { total: 0, page: 1, pages: 1, limit: 9 });
        }
      } catch (err) {
        console.error('Doctors search error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [searchParams]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (filterName.trim()) newParams.set('name', filterName.trim());
    if (filterSpec) newParams.set('specialization', filterSpec);
    if (filterHospital) newParams.set('hospital', filterHospital);
    if (filterCity.trim()) newParams.set('city', filterCity.trim());
    if (filterDate) newParams.set('date', filterDate);
    newParams.set('page', '1');

    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setFilterName('');
    setFilterSpec('');
    setFilterHospital('');
    setFilterCity('');
    setFilterDate('');
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', newPage.toString());
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Search Specialist Doctors</h1>
        <p className="text-sm text-slate-500 mt-1">
          Showing {pagination.total} registered SLMC specialist doctors available for channeling.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm sticky top-24 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center">
                <Filter className="w-4 h-4 mr-1.5 text-brand-600" /> Filter Doctors
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-slate-400 hover:text-brand-600 flex items-center font-semibold"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Reset
              </button>
            </div>

            <form onSubmit={handleApplyFilters} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Doctor Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Perera"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Specialization
                </label>
                <select
                  value={filterSpec}
                  onChange={(e) => setFilterSpec(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Specializations</option>
                  {specializations.map((s) => (
                    <option key={s._id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Hospital
                </label>
                <select
                  value={filterHospital}
                  onChange={(e) => setFilterHospital(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Hospitals</option>
                  {hospitals.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Colombo, Wattala"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Session Date
                </label>
                <input
                  type="date"
                  value={filterDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow transition-colors flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Apply Filters</span>
              </button>
            </form>
          </div>
        </aside>

        {/* Doctor Results Grid */}
        <main className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="No doctors match your criteria"
              description="Try adjusting your filters or search terms to find available specialists."
              action={
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-brand-50 text-brand-700 font-bold text-sm rounded-lg hover:bg-brand-100"
                >
                  Clear All Filters
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => {
                const nextSession = doctor.nextSchedule;
                const remaining = nextSession ? nextSession.maxPatients - nextSession.bookedCount : 0;

                return (
                  <div
                    key={doctor._id}
                    className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-brand-500 hover:shadow-lg hover:shadow-brand-600/5 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Doctor Avatar & Basic Info */}
                      <div className="flex items-start space-x-4 mb-4">
                        <img
                          src={
                            doctor.profileImageUrl ||
                            doctor.profileImage ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              doctor.user?.name || 'Doctor'
                            )}&background=0d9488&color=fff&size=128`
                          }
                          alt={doctor.user?.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-slate-900 text-base leading-snug truncate">
                            {doctor.user?.name}
                          </h3>
                          <span className="inline-block text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full mt-1">
                            {doctor.specialization?.name}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1">
                            SLMC: <span className="font-mono font-medium text-slate-600">{doctor.slmcNo}</span>
                          </p>
                        </div>
                      </div>

                      {/* Bio snippet & Experience */}
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                        {doctor.bio || 'Consultant specialist providing comprehensive clinical care.'}
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-500 py-2 border-y border-slate-100 mb-4">
                        <span>Experience: <strong className="text-slate-700">{doctor.experienceYears} yrs</strong></span>
                        <span>Fee: <strong className="text-brand-700 font-bold">LKR {doctor.channelingFee.toLocaleString()}</strong></span>
                      </div>

                      {/* Next Available Session Banner */}
                      {nextSession ? (
                        <div className="p-3 bg-brand-50/70 rounded-xl border border-brand-100 text-xs mb-4">
                          <div className="flex items-center justify-between font-bold text-brand-900 mb-1">
                            <span className="flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1 text-brand-600" />
                              {formatDate(nextSession.date)}
                            </span>
                            <span className="text-slate-600 font-medium">{nextSession.startTime}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                            <span className="truncate max-w-[130px]">{nextSession.hospital?.name}</span>
                            <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                              {remaining} seat{remaining === 1 ? '' : 's'} left
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-400 text-center mb-4 border border-slate-100">
                          No upcoming sessions scheduled
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Link
                      to={`/doctors/${doctor._id}`}
                      className="w-full py-2.5 bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-colors text-center block"
                    >
                      View Profile & Book
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 inline" /> Prev
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-4 h-4 inline" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorsSearch;
