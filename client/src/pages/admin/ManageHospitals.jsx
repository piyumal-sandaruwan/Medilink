import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Power, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export const ManageHospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, isEdit: false, data: null });
  const [formData, setFormData] = useState({
    name: '',
    registrationNo: '',
    type: 'hospital',
    city: 'Colombo',
    address: '',
    phone: '',
    image: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/admin/hospitals');
      if (res.success && res.data) {
        setHospitals(res.data);
      }
    } catch (err) {
      toast.error('Failed to load hospitals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      registrationNo: `PV-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'hospital',
      city: 'Colombo',
      address: '',
      phone: '0112000000',
      image: '',
    });
    setModal({ open: true, isEdit: false, data: null });
  };

  const handleOpenEdit = (h) => {
    setFormData({
      name: h.name,
      registrationNo: h.registrationNo,
      type: h.type,
      city: h.city,
      address: h.address,
      phone: h.phone,
      image: h.image || '',
    });
    setModal({ open: true, isEdit: true, data: h });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modal.isEdit) {
        const res = await api.put(`/admin/hospitals/${modal.data._id}`, formData);
        toast.success(res.message || 'Hospital updated successfully!');
      } else {
        const res = await api.post('/admin/hospitals', formData);
        toast.success(res.message || 'Hospital created successfully!');
      }
      setModal({ open: false, isEdit: false, data: null });
      fetchHospitals();
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (h) => {
    try {
      const res = await api.delete(`/admin/hospitals/${h._id}`);
      toast.success(res.message || 'Status updated!');
      fetchHospitals();
    } catch (err) {
      toast.error(err.message || 'Status update failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Health Facility Registry
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-0.5">Manage Partner Hospitals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Register and configure hospitals and channeling centres island-wide.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Facility</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-extrabold text-slate-900 text-lg">Hospital Directory ({hospitals.length})</h3>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : (
          <div className="divide-y divide-slate-100">
            {hospitals.map((h) => (
              <div
                key={h._id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-slate-900 text-base">{h.name}</h4>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {h.type?.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        h.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {h.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="font-mono font-semibold">Reg: {h.registrationNo}</span>
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {h.city} — {h.address}
                    </span>
                    <span className="flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {h.phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleOpenEdit(h)}
                    className="p-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Edit Facility"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(h)}
                    className={`p-2 rounded-lg transition-colors ${
                      h.isActive
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={h.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hospital Form Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <h3 className="font-black text-slate-900 text-xl">
              {modal.isEdit ? 'Edit Hospital Facility' : 'Add New Hospital Facility'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hospital Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Asiri Central Hospital"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Registration No *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.registrationNo}
                    onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                    placeholder="PV-XXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Facility Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="hospital">Hospital</option>
                    <option value="channeling_centre">Channeling Centre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address and postal code"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal({ open: false, isEdit: false, data: null })}
                  className="flex-1 py-2.5 border border-slate-200 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow"
                >
                  {submitting ? 'Saving...' : 'Save Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHospitals;
