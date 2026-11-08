import React, { useState, useEffect } from 'react';
import { Activity, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export const ManageSpecializations = () => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSpecName, setNewSpecName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const fetchSpecs = async () => {
    try {
      const res = await api.get('/admin/specializations');
      if (res.success && res.data) {
        setSpecializations(res.data);
      }
    } catch (err) {
      toast.error('Failed to load specializations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSpecName.trim()) return;

    try {
      const res = await api.post('/admin/specializations', { name: newSpecName.trim() });
      if (res.success) {
        toast.success(res.message || 'Specialization added!');
        setNewSpecName('');
        fetchSpecs();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add specialization.');
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editingName.trim()) return;

    try {
      const res = await api.put(`/admin/specializations/${id}`, { name: editingName.trim() });
      if (res.success) {
        toast.success(res.message || 'Specialization updated!');
        setEditingId(null);
        fetchSpecs();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update specialization.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this specialization?')) return;

    try {
      const res = await api.delete(`/admin/specializations/${id}`);
      if (res.success) {
        toast.success(res.message || 'Specialization deleted!');
        fetchSpecs();
      }
    } catch (err) {
      toast.error(err.message || 'Cannot delete specialization.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
          Medical Taxonomies
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-0.5">Manage Specializations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure clinical specializations available for doctor categorization.
        </p>
      </div>

      {/* Add Specialization Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
          <Plus className="w-4 h-4 mr-1.5 text-brand-600" /> Add New Specialization
        </h3>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="text"
            required
            placeholder="e.g. Endocrinology, Rheumatology"
            value={newSpecName}
            onChange={(e) => setNewSpecName(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow transition-colors"
          >
            Add Specialization
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-lg">
          Configured Specializations ({specializations.length})
        </h3>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : (
          <div className="divide-y divide-slate-100">
            {specializations.map((spec) => {
              const isEditing = editingId === spec._id;
              return (
                <div key={spec._id} className="py-3 flex items-center justify-between gap-4">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => handleSaveEdit(spec._id)}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 border border-slate-200 text-xs rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-brand-600" />
                        <span className="font-bold text-slate-800 text-sm">{spec.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingId(spec._id);
                            setEditingName(spec.name);
                          }}
                          className="p-1.5 text-slate-500 hover:text-brand-600 rounded-lg hover:bg-brand-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(spec._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSpecializations;
