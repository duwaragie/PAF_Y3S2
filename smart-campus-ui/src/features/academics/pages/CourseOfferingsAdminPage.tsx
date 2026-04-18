import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  courseOfferingService,
  type CourseOfferingDTO,
  type CourseOfferingStatus,
} from '@/services/courseOfferingService';
import {
  courseSectionService,
  type CourseSectionDTO,
  type CreateCourseSectionPayload,
} from '@/services/courseSectionService';
import { adminService, type UserDTO } from '@/services/adminService';

const STATUSES: CourseOfferingStatus[] = ['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED'];

const statusStyle: Record<CourseOfferingStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  OPEN: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-amber-100 text-amber-700',
  ARCHIVED: 'bg-red-100 text-red-600',
};

type OfferingForm = {
  code: string;
  title: string;
  description: string;
  semester: string;
  credits: string;
  prerequisites: string;
  status: CourseOfferingStatus;
};

const emptyOfferingForm: OfferingForm = {
  code: '',
  title: '',
  description: '',
  semester: '',
  credits: '3',
  prerequisites: '',
  status: 'DRAFT',
};

type SectionForm = {
  label: string;
  capacity: string;
  lecturerId: string;
};

const emptySectionForm: SectionForm = {
  label: '',
  capacity: '40',
  lecturerId: '',
};

export default function CourseOfferingsAdminPage() {
  const [offerings, setOfferings] = useState<CourseOfferingDTO[]>([]);
  const [lecturers, setLecturers] = useState<UserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busyOfferingId, setBusyOfferingId] = useState<number | null>(null);

  // Offering create/edit modal
  const [showOfferingForm, setShowOfferingForm] = useState(false);
  const [editingOfferingId, setEditingOfferingId] = useState<number | null>(null);
  const [offeringForm, setOfferingForm] = useState<OfferingForm>(emptyOfferingForm);
  const [savingOffering, setSavingOffering] = useState(false);
  const [deleteOfferingConfirm, setDeleteOfferingConfirm] = useState<CourseOfferingDTO | null>(null);

  // Section create/edit modal
  const [sectionForOfferingId, setSectionForOfferingId] = useState<number | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [sectionForm, setSectionForm] = useState<SectionForm>(emptySectionForm);
  const [savingSection, setSavingSection] = useState(false);
  const [deleteSectionConfirm, setDeleteSectionConfirm] = useState<CourseSectionDTO | null>(null);

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

  // --- Offering handlers ---
  const openCreateOffering = () => {
    setOfferingForm(emptyOfferingForm);
    setEditingOfferingId(null);
    setShowOfferingForm(true);
    clearMessages();
  };

  const openEditOffering = (o: CourseOfferingDTO) => {
    setOfferingForm({
      code: o.code,
      title: o.title,
      description: o.description || '',
      semester: o.semester,
      credits: String(o.credits),
      prerequisites: o.prerequisites || '',
      status: o.status,
    });
    setEditingOfferingId(o.id);
    setShowOfferingForm(true);
    clearMessages();
  };

  const handleOfferingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSavingOffering(true);
      clearMessages();
      const payload = {
        code: offeringForm.code.trim(),
        title: offeringForm.title.trim(),
        description: offeringForm.description.trim() || undefined,
        semester: offeringForm.semester.trim(),
        credits: parseFloat(offeringForm.credits),
        prerequisites: offeringForm.prerequisites.trim() || undefined,
        status: offeringForm.status,
      };
      if (editingOfferingId) {
        const res = await courseOfferingService.update(editingOfferingId, payload);
        setOfferings((prev) => prev.map((o) => (o.id === editingOfferingId ? res.data : o)));
        setSuccess(`"${res.data.code}" updated.`);
      } else {
        const res = await courseOfferingService.create(payload);
        setOfferings((prev) => [...prev, res.data]);
        setExpandedId(res.data.id);
        setSuccess(`"${res.data.code}" created. Add at least one section before opening for enrollment.`);
      }
      setShowOfferingForm(false);
      setOfferingForm(emptyOfferingForm);
      setEditingOfferingId(null);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save course offering.');
    } finally {
      setSavingOffering(false);
    }
  };

  const handleStatusChange = async (o: CourseOfferingDTO, status: CourseOfferingStatus) => {
    if (status === 'OPEN' && (!o.sections || o.sections.length === 0)) {
      setError('Add at least one section before opening the offering for enrollment.');
      return;
    }
    try {
      setBusyOfferingId(o.id);
      const res = await courseOfferingService.updateStatus(o.id, status);
      setOfferings((prev) => prev.map((x) => (x.id === o.id ? res.data : x)));
    } catch {
      setError('Failed to update status.');
    } finally {
      setBusyOfferingId(null);
    }
  };

  const handleDeleteOffering = async () => {
    if (!deleteOfferingConfirm) return;
    try {
      setBusyOfferingId(deleteOfferingConfirm.id);
      await courseOfferingService.delete(deleteOfferingConfirm.id);
      setOfferings((prev) => prev.filter((o) => o.id !== deleteOfferingConfirm.id));
      setSuccess(`"${deleteOfferingConfirm.code}" deleted.`);
      setDeleteOfferingConfirm(null);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to delete offering.');
      setDeleteOfferingConfirm(null);
    } finally {
      setBusyOfferingId(null);
    }
  };

  // --- Section handlers ---
  const openCreateSection = (offeringId: number) => {
    setSectionForm(emptySectionForm);
    setEditingSectionId(null);
    setSectionForOfferingId(offeringId);
    clearMessages();
  };

  const openEditSection = (s: CourseSectionDTO) => {
    setSectionForm({
      label: s.label,
      capacity: String(s.capacity),
      lecturerId: s.lecturerId ? String(s.lecturerId) : '',
    });
    setEditingSectionId(s.id);
    setSectionForOfferingId(s.offeringId);
    clearMessages();
  };

  const closeSectionForm = () => {
    setSectionForOfferingId(null);
    setEditingSectionId(null);
    setSectionForm(emptySectionForm);
  };

  const handleSectionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sectionForOfferingId) return;
    try {
      setSavingSection(true);
      clearMessages();
      const payload: CreateCourseSectionPayload = {
        label: sectionForm.label.trim(),
        capacity: parseInt(sectionForm.capacity, 10),
        lecturerId: sectionForm.lecturerId ? parseInt(sectionForm.lecturerId, 10) : null,
      };
      if (editingSectionId) {
        await courseSectionService.update(editingSectionId, payload);
      } else {
        await courseSectionService.create(sectionForOfferingId, payload);
      }
      await loadAll();
      closeSectionForm();
      setSuccess(editingSectionId ? 'Section updated.' : 'Section added.');
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save section.');
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!deleteSectionConfirm) return;
    try {
      await courseSectionService.delete(deleteSectionConfirm.id);
      await loadAll();
      setDeleteSectionConfirm(null);
      setSuccess('Section removed.');
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to remove section.');
      setDeleteSectionConfirm(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">Course Offerings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Each offering can have multiple sections. Students pick a section when enrolling; each section has its own lecturer and capacity.
            </p>
          </div>
          <button
            onClick={openCreateOffering}
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
        ) : offerings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
            No course offerings yet. Click "Add Course Offering" to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {offerings.map((o) => {
              const expanded = expandedId === o.id;
              return (
                <div key={o.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 flex items-center gap-4">
                    <button
                      onClick={() => setExpandedId(expanded ? null : o.id)}
                      className="shrink-0 w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
                      aria-label={expanded ? 'Collapse' : 'Expand'}
                    >
                      <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-campus-700">{o.code}</span>
                          <span className="text-[10px] text-gray-400">{o.semester}</span>
                        </div>
                        <p className="text-sm font-semibold text-campus-900 truncate">{o.title}</p>
                        {o.lecturerNames && (
                          <p className="text-[11px] text-gray-400 truncate">Lecturers: {o.lecturerNames}</p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="text-gray-400">Credits:</span>{' '}
                        <span className="font-semibold text-campus-800">{o.credits}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="text-gray-400">Sections:</span>{' '}
                        <span className="font-semibold text-campus-800">{o.sections?.length ?? 0}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="text-gray-400">Seats:</span>{' '}
                        <span className="font-semibold text-campus-800">{o.totalEnrolled}/{o.totalCapacity}</span>
                      </div>
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o, e.target.value as CourseOfferingStatus)}
                        disabled={busyOfferingId === o.id}
                        className={`text-[11px] font-semibold rounded-md px-2 py-1 border border-transparent focus:outline-none focus:ring-2 focus:ring-campus-200 ${statusStyle[o.status]}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditOffering(o)}
                        className="text-xs font-semibold text-campus-700 hover:text-campus-900 px-2 py-1 rounded-md hover:bg-campus-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteOfferingConfirm(o)}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Sections ({o.sections?.length ?? 0})
                        </h4>
                        <button
                          onClick={() => openCreateSection(o.id)}
                          className="text-xs font-semibold text-campus-700 hover:text-campus-900 px-2.5 py-1 rounded-md border border-campus-200 hover:bg-white transition-colors"
                        >
                          + Add section
                        </button>
                      </div>
                      {(!o.sections || o.sections.length === 0) ? (
                        <div className="p-4 text-sm text-gray-400 text-center bg-white rounded-lg border border-dashed border-gray-200">
                          No sections yet. Add one before opening this offering for enrollment.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {o.sections.map((s) => (
                            <div key={s.id} className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex items-center gap-4">
                              <div className="w-14 h-9 rounded bg-campus-50 text-campus-700 text-xs font-bold flex items-center justify-center shrink-0">
                                {s.label}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-campus-800 truncate">
                                  {s.lecturerName || 'Unassigned lecturer'}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {s.enrolledCount}/{s.capacity} enrolled &bull; {s.seatsAvailable} free
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => openEditSection(s)} className="text-xs font-semibold text-campus-700 hover:text-campus-900 px-2 py-1 rounded-md hover:bg-campus-50">
                                  Edit
                                </button>
                                <button onClick={() => setDeleteSectionConfirm(s)} className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50">
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Offering form modal */}
        {showOfferingForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
              onSubmit={handleOfferingSubmit}
              className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-campus-900">
                  {editingOfferingId ? 'Edit course offering' : 'Add course offering'}
                </h3>
                <button type="button" onClick={() => setShowOfferingForm(false)} className="text-gray-400 hover:text-campus-800 p-1">✕</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Code *</label>
                  <input required value={offeringForm.code} onChange={(e) => setOfferingForm({ ...offeringForm, code: e.target.value })} placeholder="IT3030" className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-campus-200" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Semester *</label>
                  <input required value={offeringForm.semester} onChange={(e) => setOfferingForm({ ...offeringForm, semester: e.target.value })} placeholder="2026-Y3S2" className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Title *</label>
                <input required value={offeringForm.title} onChange={(e) => setOfferingForm({ ...offeringForm, title: e.target.value })} placeholder="Programming Application Frameworks" className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                <textarea value={offeringForm.description} onChange={(e) => setOfferingForm({ ...offeringForm, description: e.target.value })} rows={3} className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Credits *</label>
                  <input required type="number" step="0.5" min="0.5" max="12" value={offeringForm.credits} onChange={(e) => setOfferingForm({ ...offeringForm, credits: e.target.value })} className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                  <select value={offeringForm.status} onChange={(e) => setOfferingForm({ ...offeringForm, status: e.target.value as CourseOfferingStatus })} className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Prerequisites (comma-separated course codes)</label>
                <input value={offeringForm.prerequisites} onChange={(e) => setOfferingForm({ ...offeringForm, prerequisites: e.target.value })} placeholder="IT2030,IT2040" className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-campus-200" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowOfferingForm(false)} className="px-4 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" disabled={savingOffering} className="px-4 h-10 rounded-lg text-sm font-semibold text-white bg-campus-800 hover:bg-campus-700 disabled:opacity-60 transition-colors">
                  {savingOffering ? 'Saving...' : editingOfferingId ? 'Save changes' : 'Create offering'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Section form modal */}
        {sectionForOfferingId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
              onSubmit={handleSectionSubmit}
              className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 animate-slide-up"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-campus-900">
                  {editingSectionId ? 'Edit section' : 'Add section'}
                </h3>
                <button type="button" onClick={closeSectionForm} className="text-gray-400 hover:text-campus-800 p-1">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Label *</label>
                  <input required value={sectionForm.label} onChange={(e) => setSectionForm({ ...sectionForm, label: e.target.value })} placeholder="Group A" className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Capacity *</label>
                  <input required type="number" min="1" value={sectionForm.capacity} onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })} className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Lecturer</label>
                <select value={sectionForm.lecturerId} onChange={(e) => setSectionForm({ ...sectionForm, lecturerId: e.target.value })} className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200">
                  <option value="">Unassigned</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={closeSectionForm} className="px-4 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" disabled={savingSection} className="px-4 h-10 rounded-lg text-sm font-semibold text-white bg-campus-800 hover:bg-campus-700 disabled:opacity-60 transition-colors">
                  {savingSection ? 'Saving...' : editingSectionId ? 'Save' : 'Add section'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete confirms */}
        {deleteOfferingConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
              <h3 className="text-lg font-bold text-campus-900">Delete course offering?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This will permanently delete <span className="font-semibold text-campus-800">{deleteOfferingConfirm.code}</span> for {deleteOfferingConfirm.semester} along with its sections.
                Deletion is blocked if students are currently enrolled.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteOfferingConfirm(null)}
                  disabled={busyOfferingId !== null}
                  className="px-4 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60"
                >Cancel</button>
                <button
                  onClick={handleDeleteOffering}
                  disabled={busyOfferingId !== null}
                  className="px-4 h-10 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
                >{busyOfferingId !== null ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>
        )}

        {deleteSectionConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
              <h3 className="text-lg font-bold text-campus-900">Remove section?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This will remove section <span className="font-semibold text-campus-800">{deleteSectionConfirm.label}</span>.
                Removal is blocked if students are enrolled in it.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteSectionConfirm(null)}
                  disabled={savingSection}
                  className="px-4 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60"
                >Cancel</button>
                <button
                  onClick={handleDeleteSection}
                  disabled={savingSection}
                  className="px-4 h-10 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
                >Remove</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
