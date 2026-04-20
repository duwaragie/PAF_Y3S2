import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { auditService, type AuditLogEntry } from '@/services/auditService';

const PAGE_SIZE = 25;

function formatDateTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function AuditPage() {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [actors, setActors] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filters = useMemo(() => ({
    actor: actor || undefined,
    action: action || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to).toISOString() : undefined,
  }), [actor, action, from, to]);

  useEffect(() => {
    auditService.actions().then((res) => setActions(res.data)).catch(() => {});
    auditService.actors().then((res) => setActors(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    auditService
      .list({ ...filters, page, size: PAGE_SIZE })
      .then((res) => {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
      })
      .catch((err) => {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || 'Failed to load audit log.');
      })
      .finally(() => setLoading(false));
  }, [filters, page]);

  const onExport = async () => {
    try {
      setExporting(true);
      await auditService.downloadCsv(filters);
    } catch {
      setError('Failed to export CSV.');
    } finally {
      setExporting(false);
    }
  };

  const onApply = () => setPage(0);
  const onReset = () => {
    setActor('');
    setAction('');
    setFrom('');
    setTo('');
    setPage(0);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-campus-500 bg-campus-50 px-2.5 py-1 rounded-md">
            Admin only
          </span>
          <h1 className="text-2xl font-bold text-campus-900 leading-tight">Audit Log</h1>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Security-relevant events recorded across the platform. Filter by actor, action, or date,
            then export the current filter to CSV.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Actor email</label>
              <select
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
              >
                <option value="">Any</option>
                {actors.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Action</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
              >
                <option value="">Any</option>
                {actions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">From</label>
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">To</label>
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onApply}
              className="h-10 px-4 rounded-lg bg-campus-800 hover:bg-campus-700 text-white text-sm font-semibold"
            >
              Apply
            </button>
            <button
              onClick={onReset}
              className="h-10 px-4 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={onExport}
              disabled={exporting}
              className="h-10 px-4 rounded-lg border border-campus-200 text-campus-800 text-sm font-semibold hover:bg-campus-50 disabled:opacity-60 ml-auto"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl text-sm bg-red-50 text-red-600 border border-red-100">{error}</div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {loading ? 'Loading...' : `${totalElements} entries`}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">When</th>
                  <th className="px-4 py-2.5 text-left">Actor</th>
                  <th className="px-4 py-2.5 text-left">Action</th>
                  <th className="px-4 py-2.5 text-left">Target</th>
                  <th className="px-4 py-2.5 text-left">Details</th>
                  <th className="px-4 py-2.5 text-left">IP</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      No audit entries match the current filters.
                    </td>
                  </tr>
                )}
                {items.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-2.5 whitespace-nowrap text-gray-600">{formatDateTime(row.createdAt)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-campus-800 font-medium">{row.actorEmail || '—'}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[12px] text-campus-700">{row.action}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-gray-600">
                      {row.targetType ? `${row.targetType} ${row.targetId ?? ''}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-md truncate" title={row.details ?? ''}>
                      {row.details || '—'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-gray-400 font-mono text-[12px]">{row.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-600">
              <span>Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-9 px-3 rounded-lg border border-gray-200 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-9 px-3 rounded-lg border border-gray-200 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
