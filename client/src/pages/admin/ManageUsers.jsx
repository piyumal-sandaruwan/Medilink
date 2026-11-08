import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Power, Shield, Building2, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Create Hospital Admin modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    hospital: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (roleFilter !== 'all') query.set('role', roleFilter);
      if (search.trim()) query.set('search', search.trim());

      const res = await api.get(`/admin/users?${query.toString()}`);
      if (res.success && res.data) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await api.get('/hospitals');
        if (res.success && res.data) {
          setHospitals(res.data);
          if (res.data.length > 0) {
            setFormData((prev) => ({ ...prev, hospital: res.data[0]._id }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch hospitals:', err);
      }
    };
    fetchHospitals();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await api.patch(`/admin/users/${user._id}/status`, {
        isActive: !user.isActive,
      });
      if (res.success) {
        toast.success(res.message || 'User status updated!');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Status change failed.');
    }
  };

  const handleCreateHospitalAdmin = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/admin/hospital-admins', formData);
      if (res.success) {
        toast.success(res.message || 'Hospital admin created!');
        setModalOpen(false);
        setFormData({ name: '', email: '', password: '', phone: '', hospital: hospitals[0]?._id || '' });
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create hospital admin.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Identity & Access Management
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-0.5">User Directory & Roles</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage registered accounts, toggle access, and provision hospital administration credentials.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Hospital Admin</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Role Filter Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
            {['all', 'patient', 'doctor', 'hospital_admin', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  roleFilter === role
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {role.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
            >
              Search
            </button>
          </form>
        </div>

        {/* User Table */}
        {loading ? (
          <TableSkeleton rows={6} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="No user accounts match your filter criteria."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div
                key={u._id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-slate-900 text-base">{u.name}</h4>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {u.role.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {u.email}
                    </span>
                    <span className="flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {u.phone}
                    </span>
                    {u.hospital && (
                      <span className="flex items-center font-medium text-brand-700">
                        <Building2 className="w-3.5 h-3.5 mr-1 text-brand-600" />
                        {u.hospital.name}
                      </span>
                    )}
                  </div>
                </div>

                {u.role !== 'admin' && (
                  <button
                    onClick={() => handleToggleStatus(u)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      u.isActive
                        ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                        : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Provision Hospital Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6">
            <h3 className="font-black text-slate-900 text-xl">Create Hospital Administrator</h3>
            <p className="text-xs text-slate-500">
              Link an administrator account strictly to one hospital facility.
            </p>

            <form onSubmit={handleCreateHospitalAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asiri Central Admin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="admin.asiri@hospital.lk"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="0112345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Assign Hospital Facility *
                </label>
                <select
                  required
                  value={formData.hospital}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  {hospitals.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
