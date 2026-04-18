import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  courseOfferingService,
  type CourseOfferingDTO,
  type CourseOfferingStatus,
} from '@/services/courseOfferingService';
import { adminService, type UserDTO } from '@/services/adminService';

const STATUSES: CourseOfferingStatus[] = ['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED'];

const statusStyle: Record<CourseOfferingStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  OPEN: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-amber-100 text-amber-700',
  ARCHIVED: 'bg-red-100 text-red-600',
};

type FormState = {
  code: string;
  title: string;
  description: string;
  semester: string;
  credits: string;
  capacity: string;
  lecturerId: string;
  prerequisites: string;
  status: CourseOfferingStatus;
};

const emptyForm: FormState = {
  code: '',
  title: '',
  description: '',
  semester: '',
  credits: '3',
  capacity: '40',
  lecturerId: '',
  prerequisites: '',
  status: 'DRAFT',
};

export default function CourseOfferingsAdminPage() {
  const [offerings, setOfferings] = useState<CourseOfferingDTO[]>([]);
  const [lecturers, setLecturers] = useState<UserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CourseOfferingDTO | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    void loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [offeringsRes, usersRes] = await Promise.all([
        courseOfferingService.list(),
        adminService.getAllUsers().catch(() => ({ data: [] as UserDTO[] })),
      ]);
      setOfferings(offeringsRes.data);
      setLecturers(
        (usersRes.data || []).filter((u) => u.role === 'LECTURER' || u.role === 'ADMIN'),
      );
    } catch {
      setError('Failed to load course offerings.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    clearMessages();
  };

  const openEdit = (o: CourseOfferingDTO) => {
    setForm({
      code: o.code,
      title: o.title,
      description: o.description || '',
      semester: o.semester,
      credits: String(o.credits),
      capacity: String(o.capacity),
      lecturerId: o.lecturerId ? String(o.lecturerId) : '',
      prerequisites: o.prerequisites || '',
      status: o.status,
    });
    setEditingId(o.id);
    setShowForm(true);
    clearMessages();
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSaving(true);
      clearMessages();
      const payload = {
        code: form.code.trim(),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        semester: form.semester.trim(),
        credits: parseFloat(form.credits),
        capacity: parseInt(form.capacity, 10),
        lecturerId: form.lecturerId ? parseInt(form.lecturerId, 10) : null,
        prerequisites: form.prerequisites.trim() || undefined,
        status: form.status,
      };
      if (editingId) {
        const res = await courseOfferingService.update(editingId, payload);
        setOfferings((prev) => prev.map((o) => (o.id === editingId ? res.data : o)));
        setSuccess(`"${res.data.code}" updated.`);
      } else {
        const res = await courseOfferingService.create(payload);
        setOfferings((prev) => [...prev, res.data]);
        setSuccess(`"${res.data.code}" created.`);
      }
      closeForm();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save course offering.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (o: CourseOfferingDTO, status: CourseOfferingStatus) => {
    try {
      setBusyId(o.id);
      const res = await courseOfferingService.updateStatus(o.id, status);
      setOfferings((prev) => prev.map((x) => (x.id === o.id ? res.data : x)));
    } catch {
      setError('Failed to update status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setBusyId(deleteConfirm.id);
      await courseOfferingService.delete(deleteConfirm.id);
      setOfferings((prev) => prev.filter((o) => o.id !== deleteConfirm.id));
      setSuccess(`"${deleteConfirm.code}" deleted.`);
      setDeleteConfirm(null);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to delete offering.');
      setDeleteConfirm(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">Course Offerings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create, edit, and manage course offerings per semester. Set status to OPEN to let students enroll.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="shrink-0 h-10 px-5 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 transition-colors"
          >
            + Add Course Offering
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
            {success}
          </div>
        )}

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
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Code</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Semester</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Credits</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lecturer</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Seats</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offerings.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm font-mono font-semibold text-campus-800">{o.code}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{o.title}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{o.semester}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{o.credits}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{o.lecturerName || '—'}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {o.enrolledCount}/{o.capacity}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o, e.target.value as CourseOfferingStatus)}
                          disabled={busyId === o.id}
                          className={`text-[11px] font-semibold rounded-md px-2 py-1 border border-transparent focus:outline-none focus:ring-2 focus:ring-campus-200 ${statusStyle[o.status]}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEdit(o)}
                            disabled={busyId === o.id}
                            className="text-xs font-semibold text-campus-700 hover:text-campus-900 px-2 py-1 rounded-md hover:bg-campus-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(o)}
                            disabled={busyId === o.id}
                            className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {offerings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">
                        No course offerings yet. Click "Add Course Offering" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create / Edit modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-campus-900">
                  {editingId ? 'Edit course offering' : 'Add course offering'}
                </h3>
                <button type="button" onClick={closeForm} className="text-gray-400 hover:text-campus-800 p-1">
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Code *</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="IT3030"
                    className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-campus-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Semester *</label>
                  <input
                    required
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    placeholder="2026-Y3S2"
                    className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Programming Application Frameworks"
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Credits *</label>
                  <input
                    required
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Capacity *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as CourseOfferingStatus })}
                    className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Lecturer</label>
                <select
                  value={form.lecturerId}
                  onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200"
                >
                  <option value="">Unassigned</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Prerequisites (comma-separated course codes)</label>
                <input
                  value={form.prerequisites}
                  onChange={(e) => setForm({ ...form, prerequisites: e.target.value })}
                  placeholder="IT2030,IT2040"
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-campus-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="px-4 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 h-10 rounded-lg text-sm font-semibold text-white bg-campus-800 hover:bg-campus-700 disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create offering'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
              <h3 className="text-lg font-bold text-campus-900">Delete course offering?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This will permanently delete <span className="font-semibold text-campus-800">{deleteConfirm.code}</span> for {deleteConfirm.semester}.
                Deletion is blocked if students are currently enrolled.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} className="px-4 h-10 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
