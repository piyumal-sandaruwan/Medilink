import React, { useState, useEffect } from 'react';
import { Building2, Plus, CheckCircle2, Clock, XCircle, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export const DoctorHospitals = () => {
  const [affiliations, setAffiliations] = useState([]);
  const [allHospitals, setAllHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const fetchData = async () => {
    try {
      const [affRes, hospRes] = await Promise.all([
        api.get('/doctors/me/hospitals'),
        api.get('/hospitals'),
      ]);
      if (affRes.success) setAffiliations(affRes.data || []);
      if (hospRes.success) {
        setAllHospitals(hospRes.data || []);
        if (hospRes.data?.length > 0) setSelectedHospital(hospRes.data[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load hospital affiliation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestAffiliation = async (e) => {
    e.preventDefault();
    if (!selectedHospital) return;

    setRequesting(true);
    try {
      const res = await api.post('/doctors/me/hospital-requests', {
        hospitalId: selectedHospital,
      });
      if (res.success) {
        toast.success(res.message || 'Affiliation requested successfully!');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Request failed.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Hospital Affiliations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your hospital partnerships. You can schedule channeling sessions only at approved facilities.
        </p>
      </div>

      {/* Request New Affiliation Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center">
          <Plus className="w-5 h-5 mr-2 text-brand-600" /> Request New Hospital Link
        </h3>
        <form onSubmit={handleRequestAffiliation} className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {allHospitals.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name} — {h.city} ({h.type})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={requesting}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow transition-colors disabled:opacity-50"
          >
            {requesting ? 'Submitting...' : 'Request Affiliation'}
          </button>
        </form>
      </div>

      {/* Current Affiliations List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-900 text-lg">My Affiliated Hospitals ({affiliations.length})</h3>

        {affiliations.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No hospital affiliations"
            description="You have not requested affiliation with any hospitals yet. Submit a request above."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {affiliations.map((item) => {
              const hospital = item.hospital;
              return (
                <div
                  key={item._id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{hospital?.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {hospital?.city} — {hospital?.address}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center mt-0.5">
                        <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {hospital?.phone}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400">
                    <span>Reg No: {hospital?.registrationNo}</span>
                    <span>Requested: {new Date(item.createdAt).toLocaleDateString()}</span>
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

export default DoctorHospitals;
