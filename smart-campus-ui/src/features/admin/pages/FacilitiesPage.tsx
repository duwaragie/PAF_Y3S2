import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { resourceService, type ResourceDTO } from '@/services/resourceService';

const TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'] as const;
const STATUSES = ['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'] as const;

const typeLabels: Record<string, string> = {
  LECTURE_HALL: 'Lecture Hall', LAB: 'Lab', MEETING_ROOM: 'Meeting Room', EQUIPMENT: 'Equipment',
};

const statusStyle: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  OUT_OF_SERVICE: 'bg-red-100 text-red-700',
  UNDER_MAINTENANCE: 'bg-amber-100 text-amber-700',
};

type FormState = { name: string; type: ResourceDTO['type']; capacity: string; location: string; availabilityWindows: string; status: ResourceDTO['status'] };
const emptyForm: FormState = { name: '', type: 'LAB', capacity: '', location: '', availabilityWindows: '', status: 'ACTIVE' };

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function FacilitiesPage() {
  const [resources, setResources] = useState<ResourceDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ResourceDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadResources(); }, []);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const res = await resourceService.getAll();
      setResources(res.data);
    } catch {
      setError('Failed to load resources.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => { setError(null); setSuccess(null); };

  const openCreate = () => {
    setForm(emptyForm);
    setFormErrors({});
    setEditingId(null);
    setShowForm(true);
    clearMessages();
  };

  const openEdit = (r: ResourceDTO) => {
    setForm({
      name: r.name,
      type: r.type,
      capacity: r.capacity?.toString() || '',
      location: r.location || '',
      availabilityWindows: r.availabilityWindows || '',
      status: r.status,
    });
    setFormErrors({});
    setEditingId(r.id);
    setShowForm(true);
    clearMessages();
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.location.trim()) errors.location = 'Location is required';
    if (form.capacity && (isNaN(parseInt(form.capacity)) || parseInt(form.capacity) < 1)) {
      errors.capacity = 'Capacity must be a positive number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSaving(true);
      clearMessages();
      const payload = {
        name: form.name.trim(),
        type: form.type,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        location: form.location.trim(),
        availabilityWindows: form.availabilityWindows.trim(),
        status: form.status,
      };
      if (editingId) {
        const res = await resourceService.update(editingId, payload);
        setResources((prev) => prev.map((r) => r.id === editingId ? res.data : r));
        setSuccess(`"${res.data.name}" updated successfully.`);
      } else {
        const res = await resourceService.create(payload);
        setResources((prev) => [...prev, res.data]);
        setSuccess(`"${res.data.name}" created successfully.`);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch {
      setError(editingId ? 'Failed to update resource.' : 'Failed to create resource.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeleting(true);
      clearMessages();
      await resourceService.delete(deleteConfirm.id);
      setResources((prev) => prev.filter((r) => r.id !== deleteConfirm.id));
      setSuccess(`"${deleteConfirm.name}" has been deleted.`);
      setDeleteConfirm(null);
    } catch {
      setError('Failed to delete resource.');
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">Facilities & Assets Catalogue</h1>
            <p className="text-sm text-gray-500 mt-1">Manage bookable resources: lecture halls, labs, meeting rooms, and equipment.</p>
          </div>
          <button onClick={openCreate} className="h-10 px-5 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 transition-colors">
            + Add Facility
          </button>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
            {error}
          </div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" /></svg>
            {success}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-sm w-full mx-4 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-campus-900">Delete Facility</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? All associated bookings and records will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 h-11 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 h-11 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-campus-900">{editingId ? 'Edit Facility' : 'Add New Facility'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Name <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormErrors({ ...formErrors, name: undefined }); }}
                  placeholder="e.g. Computer Lab 101"
                  className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 ${formErrors.name ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Type <span className="text-red-400">*</span></label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FormState['type'] })} className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200">
                  {TYPES.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => { setForm({ ...form, capacity: e.target.value }); setFormErrors({ ...formErrors, capacity: undefined }); }}
                  placeholder="e.g. 30"
                  className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 ${formErrors.capacity ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
                />
                {formErrors.capacity && <p className="text-xs text-red-500 mt-1">{formErrors.capacity}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Location <span className="text-red-400">*</span></label>
                <input
                  value={form.location}
                  onChange={(e) => { setForm({ ...form, location: e.target.value }); setFormErrors({ ...formErrors, location: undefined }); }}
                  placeholder="e.g. Block A, Floor 1"
                  className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 ${formErrors.location ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
                />
                {formErrors.location && <p className="text-xs text-red-500 mt-1">{formErrors.location}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Availability Windows</label>
                <input
                  value={form.availabilityWindows}
                  onChange={(e) => setForm({ ...form, availabilityWindows: e.target.value })}
                  placeholder="e.g. Mon-Fri 08:00-18:00"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status <span className="text-red-400">*</span></label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })} className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="h-11 px-6 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 disabled:opacity-60 transition-colors">
                {saving ? 'Saving...' : editingId ? 'Update Facility' : 'Create Facility'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); }} className="h-11 px-6 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['ID', 'Name', 'Type', 'Capacity', 'Location', 'Availability', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm font-mono text-gray-500">#{r.id}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-campus-800">{r.name}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{typeLabels[r.type] || r.type}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{r.capacity ?? ''}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{r.location || ''}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{r.availabilityWindows || ''}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusStyle[r.status]}`}>{r.status.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(r)} className="text-xs font-semibold text-campus-600 hover:text-campus-700">Edit</button>
                          <button onClick={() => setDeleteConfirm(r)} className="text-xs font-semibold text-red-500 hover:text-red-700">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {resources.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">No facilities found. Click "+ Add Facility" to create one.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400">
              {resources.length} resource{resources.length !== 1 ? 's' : ''} total
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
