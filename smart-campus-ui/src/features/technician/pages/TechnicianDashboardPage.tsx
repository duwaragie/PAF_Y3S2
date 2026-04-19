import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ticketService, type TicketDTO, type TicketStatus } from '@/services/ticketService';
import { useAuthStore } from '@/store/authStore';

const STATUS_STYLE: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  REJECTED: 'bg-red-100 text-red-600',
};

const PRIORITY_STYLE: Record<string, string> = {
  LOW: 'bg-blue-50 text-blue-600',
  MEDIUM: 'bg-amber-50 text-amber-600',
  HIGH: 'bg-red-50 text-red-600',
  CRITICAL: 'bg-red-100 text-red-800 font-bold',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TechnicianDashboardPage() {
  const user = useAuthStore(s => s.user);

  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'ALL'>('ALL');

  const [selected, setSelected] = useState<TicketDTO | null>(null);
  const [newStatus, setNewStatus] = useState<TicketStatus>('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await ticketService.getAll();
      // filter to only tickets assigned to this technician
      setTickets(res.data.filter(t => t.assignedToId === user?.id));
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

  function openDetail(ticket: TicketDTO) {
    setSelected(ticket);
    const nextStatus: TicketStatus = ticket.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED';
    setNewStatus(nextStatus);
    setResolutionNotes(ticket.resolutionNotes || '');
  }

  async function handleUpdateStatus() {
    if (!selected) return;
    try {
      setUpdating(true);
      await ticketService.updateStatus(selected.id, {
        status: newStatus,
        resolutionNotes: resolutionNotes.trim() || undefined,
      });
      const res = await ticketService.getById(selected.id);
      setSelected(res.data);
      setTickets(prev => prev.map(t => t.id === res.data.id ? res.data : t));
      flashSuccess('Status updated successfully.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  }

  const myTickets = tickets;
  const filtered = filterStatus === 'ALL' ? myTickets : myTickets.filter(t => t.status === filterStatus);

  const stats = {
    total: myTickets.length,
    open: myTickets.filter(t => t.status === 'OPEN').length,
    inProgress: myTickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: myTickets.filter(t => t.status === 'RESOLVED').length,
  };

  const canUpdateStatus = selected && !['CLOSED', 'REJECTED', 'RESOLVED'].includes(selected.status);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-campus-900">My Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Tickets assigned to you — update status and add resolution notes.</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Assigned to Me', value: stats.total, color: 'text-campus-700', bg: 'bg-campus-50' },
            { label: 'Open', value: stats.open, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Resolved', value: stats.resolved, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterStatus === s ? 'bg-campus-800 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="text-sm text-gray-400 py-12 text-center">Loading your tickets…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-sm">No tickets assigned to you{filterStatus !== 'ALL' ? ` with status ${filterStatus.replace('_', ' ')}` : ''}.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Reported By</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-campus-900">{t.title}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{t.location}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{t.category.replace('_', ' ')}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${STATUS_STYLE[t.status]}`}>{t.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{t.createdByName}</td>
                    <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openDetail(t)}
                        className="text-xs font-semibold text-campus-600 hover:text-campus-800 transition-colors"
                      >
                        {['CLOSED', 'REJECTED', 'RESOLVED'].includes(t.status) ? 'View' : 'Update'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail / Update panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-campus-900">Ticket #{selected.id}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Title</p><p className="text-sm font-semibold text-campus-900">{selected.title}</p></div>
                <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Status</p>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${STATUS_STYLE[selected.status]}`}>{selected.status.replace('_', ' ')}</span>
                </div>
                <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Priority</p>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${PRIORITY_STYLE[selected.priority]}`}>{selected.priority}</span>
                </div>
                <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Category</p><p className="text-sm text-gray-700">{selected.category.replace('_', ' ')}</p></div>
                <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Location</p><p className="text-sm text-gray-700">{selected.location}</p></div>
                <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Reported By</p><p className="text-sm text-gray-700">{selected.createdByName}</p></div>
                <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Reported On</p><p className="text-sm text-gray-700">{fmtDate(selected.createdAt)}</p></div>
                {selected.preferredContactEmail && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Contact Email</p><p className="text-sm text-gray-700">{selected.preferredContactEmail}</p></div>}
                {selected.preferredContactPhone && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Contact Phone</p><p className="text-sm text-gray-700">{selected.preferredContactPhone}</p></div>}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{selected.description}</p>
              </div>

              {selected.resolutionNotes && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Resolution Notes</p>
                  <p className="text-sm text-emerald-700">{selected.resolutionNotes}</p>
                </div>
              )}

              {selected.rejectionReason && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-xs font-semibold text-red-500 uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700">{selected.rejectionReason}</p>
                </div>
              )}

              {/* Status Update */}
              {canUpdateStatus ? (
                <div className="border border-campus-100 rounded-xl p-4 space-y-4 bg-campus-50/40">
                  <p className="text-xs font-bold text-campus-700 uppercase">Update Status</p>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">New Status</label>
                    <select
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value as TicketStatus)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-300"
                    >
                      {selected.status === 'OPEN' && <option value="IN_PROGRESS">IN PROGRESS</option>}
                      {selected.status === 'IN_PROGRESS' && <option value="RESOLVED">RESOLVED</option>}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">
                      Resolution Notes {newStatus === 'RESOLVED' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={e => setResolutionNotes(e.target.value)}
                      placeholder={newStatus === 'RESOLVED' ? 'Describe what was done to resolve this issue…' : 'Optional notes about progress…'}
                      rows={4}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-campus-300 resize-none"
                    />
                    {newStatus === 'RESOLVED' && !resolutionNotes.trim() && (
                      <p className="text-[11px] text-amber-600">Resolution notes are recommended when marking as resolved.</p>
                    )}
                  </div>

                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="w-full py-2.5 text-sm font-semibold bg-campus-800 text-white rounded-xl hover:bg-campus-700 transition-colors disabled:opacity-60"
                  >
                    {updating ? 'Saving…' : `Mark as ${newStatus.replace('_', ' ')}`}
                  </button>
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400">
                    {selected.status === 'RESOLVED' ? 'This ticket has been resolved.' : `This ticket is ${selected.status.toLowerCase()} — no further updates available.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
