import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ticketService, type TicketDTO, type TicketStatus, type TicketPriority, type TicketCategory, type TicketCommentDTO } from '@/services/ticketService';
import { useAuthStore } from '@/store/authStore';

const PRIORITY_STYLE: Record<TicketPriority, string> = {
  LOW: 'bg-blue-100 text-blue-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
  CRITICAL: 'bg-red-200 text-red-900',
};

const STATUS_STYLE: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  REJECTED: 'bg-red-100 text-red-600',
};

const CATEGORIES: TicketCategory[] = [
  'ELECTRICAL', 'PLUMBING', 'IT_EQUIPMENT', 'FURNITURE', 'HVAC', 'SAFETY', 'CLEANING', 'OTHER',
];
const PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AuthImage({ imageId, onDelete, canDelete }: { imageId: number; onDelete: (id: number) => void; canDelete: boolean }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let url: string;
    ticketService.getImageBlob(imageId).then(res => {
      url = URL.createObjectURL(res.data);
      setSrc(url);
    }).catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [imageId]);

  return (
    <div className="relative group">
      {src
        ? <img src={src} alt="attachment" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
        : <div className="w-24 h-24 bg-gray-100 rounded-lg animate-pulse" />}
      {canDelete && (
        <button
          onClick={() => onDelete(imageId)}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
        >×</button>
      )}
    </div>
  );
}

const emptyForm = { title: '', location: '', category: '' as TicketCategory, description: '', priority: '' as TicketPriority, preferredContactEmail: '', preferredContactPhone: '' };

export default function MyTicketsPage() {
  const user = useAuthStore(s => s.user);
  const isLecturer = user?.role === 'TECHNICAL_STAFF';
  const canSeeAllTickets = user?.role === 'TECHNICAL_STAFF' || user?.role === 'LECTURER';
  const canManageImages = user?.role === 'TECHNICAL_STAFF' || user?.role === 'ADMIN';
  const canComment = user?.role === 'TECHNICAL_STAFF' || user?.role === 'ADMIN';

  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'ALL'>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const createFileRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<TicketDTO | null>(null);
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [editingComment, setEditingComment] = useState<TicketCommentDTO | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus>('OPEN');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { void loadTickets(); }, []);

  async function loadTickets() {
    try {
      setLoading(true);
      const res = await ticketService.getAll();
      setTickets(res.data);
    } catch {
      setError('Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  function validateForm() {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.priority) errs.priority = 'Priority is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setAttachments(prev => {
      const combined = [...prev, ...files].slice(0, 3);
      return combined;
    });
    if (createFileRef.current) createFileRef.current.value = '';
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setCreating(true);
      const res = await ticketService.create({
        title: form.title.trim(),
        location: form.location.trim(),
        category: form.category,
        description: form.description.trim(),
        priority: form.priority,
        preferredContactEmail: form.preferredContactEmail || undefined,
        preferredContactPhone: form.preferredContactPhone || undefined,
      });
      for (const file of attachments) {
        await ticketService.uploadImage(res.data.id, file);
      }
      const final = attachments.length > 0 ? (await ticketService.getById(res.data.id)).data : res.data;
      setTickets(prev => [final, ...prev]);
      setShowCreate(false);
      setForm(emptyForm);
      setAttachments([]);
      flashSuccess('Ticket created successfully.');
    } catch {
      setError('Failed to create ticket.');
    } finally {
      setCreating(false);
    }
  }

  function openDetail(ticket: TicketDTO) {
    setSelected(ticket);
    setCommentText('');
    setEditingComment(null);
    setNewStatus(ticket.status);
    setResolutionNotes(ticket.resolutionNotes || '');
  }

  async function refreshSelected(id: number) {
    const res = await ticketService.getById(id);
    setSelected(res.data);
    setTickets(prev => prev.map(t => t.id === id ? res.data : t));
  }

  async function handleAddComment() {
    if (!selected || !commentText.trim()) return;
    try {
      setAddingComment(true);
      await ticketService.addComment(selected.id, commentText.trim());
      await refreshSelected(selected.id);
      setCommentText('');
    } catch {
      setError('Failed to add comment.');
    } finally {
      setAddingComment(false);
    }
  }

  async function handleEditComment() {
    if (!selected || !editingComment || !editCommentText.trim()) return;
    try {
      await ticketService.editComment(selected.id, editingComment.id, editCommentText.trim());
      await refreshSelected(selected.id);
      setEditingComment(null);
    } catch {
      setError('Failed to edit comment.');
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!selected) return;
    try {
      await ticketService.deleteComment(selected.id, commentId);
      await refreshSelected(selected.id);
    } catch {
      setError('Failed to delete comment.');
    }
  }

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected || !e.target.files?.[0]) return;
    if (selected.imageIds.length >= 3) { setError('Maximum 3 images allowed.'); return; }
    try {
      setUploading(true);
      await ticketService.uploadImage(selected.id, e.target.files[0]);
      await refreshSelected(selected.id);
      flashSuccess('Image uploaded.');
    } catch {
      setError('Failed to upload image.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDeleteImage(imageId: number) {
    if (!selected) return;
    try {
      await ticketService.deleteImage(selected.id, imageId);
      await refreshSelected(selected.id);
    } catch {
      setError('Failed to delete image.');
    }
  }

  async function handleUpdateStatus() {
    if (!selected) return;
    try {
      setUpdatingStatus(true);
      await ticketService.updateStatus(selected.id, { status: newStatus, resolutionNotes: resolutionNotes || undefined });
      await refreshSelected(selected.id);
      flashSuccess('Status updated.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  const filtered = filterStatus === 'ALL' ? tickets : tickets.filter(t => t.status === filterStatus);
  const tabs: (TicketStatus | 'ALL')[] = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">My Tickets</h1>
            <p className="text-sm text-gray-500 mt-1">
              {canSeeAllTickets ? 'View and manage all maintenance tickets.' : 'Report and track your maintenance incidents.'}
            </p>
          </div>
          <button
            onClick={() => { setShowCreate(true); setForm(emptyForm); setFormErrors({}); setAttachments([]); }}
            className="h-10 px-5 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
            Report Ticket
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold">×</button>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{success}</div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filterStatus === tab ? 'bg-campus-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {tab === 'ALL' ? `All (${tickets.length})` : `${tab.replace('_', ' ')} (${tickets.filter(t => t.status === tab).length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading tickets…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No tickets found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['#', 'Title', 'Location', 'Category', 'Priority', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm font-mono text-gray-400">#{t.id}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-campus-800 max-w-[200px] truncate">{t.title}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 max-w-[140px] truncate">{t.location}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{t.category.replace('_', ' ')}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${STATUS_STYLE[t.status]}`}>{t.status.replace('_', ' ')}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => openDetail(t)} className="text-xs font-semibold text-campus-600 hover:text-campus-800 transition-colors">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-campus-900">Report New Ticket</h2>
              <button onClick={() => { setShowCreate(false); setAttachments([]); }} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-campus-300 ${formErrors.title ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Location *</label>
                  <input
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Building A, Room 101"
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-campus-300 ${formErrors.location ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as TicketCategory }))}
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-campus-300 ${formErrors.category ? 'border-red-400' : 'border-gray-200'}`}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                  {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Describe the issue in detail..."
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-campus-300 resize-none ${formErrors.description ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Priority *</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketPriority }))}
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-campus-300 ${formErrors.priority ? 'border-red-400' : 'border-gray-200'}`}
                  >
                    <option value="">Select priority</option>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {formErrors.priority && <p className="text-red-500 text-xs mt-1">{formErrors.priority}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={form.preferredContactEmail}
                    onChange={e => setForm(f => ({ ...f, preferredContactEmail: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-campus-300"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Phone</label>
                  <input
                    value={form.preferredContactPhone}
                    onChange={e => setForm(f => ({ ...f, preferredContactPhone: e.target.value }))}
                    placeholder="07X XXXXXXX"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-campus-300"
                  />
                </div>

                {/* Attachments */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Attachments <span className="text-gray-400 font-normal">(up to 3 images)</span></label>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="relative group flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <svg className="w-4 h-4 text-campus-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M15.172 7l-6.586 6.586a2 2 0 1 0 2.828 2.828l6.414-6.586a4 4 0 0 0-5.656-5.656l-6.415 6.585a6 6 0 1 0 8.486 8.486L20.5 13" /></svg>
                        <span className="text-xs text-gray-600 max-w-[120px] truncate">{file.name}</span>
                        <button type="button" onClick={() => removeAttachment(i)} className="text-red-400 hover:text-red-600 ml-1 text-sm font-bold">×</button>
                      </div>
                    ))}
                    {attachments.length < 3 && (
                      <button
                        type="button"
                        onClick={() => createFileRef.current?.click()}
                        className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-500 hover:border-campus-400 hover:text-campus-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 5v14M5 12h14" /></svg>
                        Add Image
                      </button>
                    )}
                  </div>
                  <input ref={createFileRef} type="file" accept="image/*" className="hidden" onChange={handleAttachmentChange} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="px-5 py-2 text-sm font-semibold bg-campus-800 text-white rounded-xl hover:bg-campus-700 transition-colors disabled:opacity-60">
                  {creating ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-400">#{selected.id}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${STATUS_STYLE[selected.status]}`}>{selected.status.replace('_', ' ')}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${PRIORITY_STYLE[selected.priority]}`}>{selected.priority}</span>
                </div>
                <h2 className="text-lg font-bold text-campus-900">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold ml-4 shrink-0">×</button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Location</p>
                  <p className="text-gray-700">{selected.location}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Category</p>
                  <p className="text-gray-700">{selected.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Reported By</p>
                  <p className="text-gray-700">{selected.createdByName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Assigned To</p>
                  <p className="text-gray-700">{selected.assignedToName || '—'}</p>
                </div>
                {selected.preferredContactEmail && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Contact Email</p>
                    <p className="text-gray-700">{selected.preferredContactEmail}</p>
                  </div>
                )}
                {selected.preferredContactPhone && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Contact Phone</p>
                    <p className="text-gray-700">{selected.preferredContactPhone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Created</p>
                  <p className="text-gray-700">{fmtDate(selected.createdAt)}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Description</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{selected.description}</p>
              </div>

              {/* Rejection Reason */}
              {selected.rejectionReason && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-xs font-semibold text-red-600 uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700">{selected.rejectionReason}</p>
                </div>
              )}

              {/* Resolution Notes */}
              {selected.resolutionNotes && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Resolution Notes</p>
                  <p className="text-sm text-emerald-700">{selected.resolutionNotes}</p>
                </div>
              )}

              {/* Status Update — Lecturer only */}
              {isLecturer && !['CLOSED', 'REJECTED'].includes(selected.status) && (
                <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Update Status</p>
                  <div className="flex gap-3 flex-wrap">
                    <select
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value as TicketStatus)}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-campus-300"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                    <input
                      value={resolutionNotes}
                      onChange={e => setResolutionNotes(e.target.value)}
                      placeholder="Resolution notes (optional)"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-campus-300"
                    />
                    <button
                      onClick={handleUpdateStatus}
                      disabled={updatingStatus}
                      className="px-4 py-1.5 text-sm font-semibold bg-campus-800 text-white rounded-lg hover:bg-campus-700 transition-colors disabled:opacity-60"
                    >
                      {updatingStatus ? 'Saving…' : 'Update'}
                    </button>
                  </div>
                </div>
              )}

              {/* Images */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Images ({selected.imageIds.length}/3)</p>
                  {canManageImages && selected.imageIds.length < 3 && (
                    <>
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="text-xs font-semibold text-campus-600 hover:text-campus-800 transition-colors disabled:opacity-60"
                      >
                        {uploading ? 'Uploading…' : '+ Upload Image'}
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                    </>
                  )}
                </div>
                {selected.imageIds.length === 0 ? (
                  <p className="text-sm text-gray-400">No images attached.</p>
                ) : (
                  <div className="flex gap-3 flex-wrap">
                    {selected.imageIds.map(id => (
                      <AuthImage key={id} imageId={id} canDelete={canManageImages} onDelete={handleDeleteImage} />
                    ))}
                  </div>
                )}
              </div>

              {/* Comments — Technical Staff and Admin only */}
              {canComment && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Comments ({selected.comments.length})</p>
                <div className="space-y-3 mb-4">
                  {selected.comments.length === 0 && <p className="text-sm text-gray-400">No comments yet.</p>}
                  {selected.comments.map(c => (
                    <div key={c.id} className="bg-gray-50 rounded-xl p-3">
                      {editingComment?.id === c.id ? (
                        <div className="flex gap-2">
                          <input
                            value={editCommentText}
                            onChange={e => setEditCommentText(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-campus-300"
                          />
                          <button onClick={handleEditComment} className="text-xs font-semibold text-campus-600 px-3">Save</button>
                          <button onClick={() => setEditingComment(null)} className="text-xs text-gray-400 px-2">Cancel</button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-campus-800">{c.authorName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">{fmtDate(c.createdAt)}</span>
                              {c.authorId === user?.id && (
                                <>
                                  <button onClick={() => { setEditingComment(c); setEditCommentText(c.content); }} className="text-[10px] text-campus-500 hover:text-campus-700">Edit</button>
                                  <button onClick={() => handleDeleteComment(c.id)} className="text-[10px] text-red-400 hover:text-red-600">Delete</button>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{c.content}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-campus-300"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleAddComment(); } }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={addingComment || !commentText.trim()}
                    className="px-4 py-2 text-sm font-semibold bg-campus-800 text-white rounded-xl hover:bg-campus-700 transition-colors disabled:opacity-60"
                  >
                    {addingComment ? '…' : 'Post'}
                  </button>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
