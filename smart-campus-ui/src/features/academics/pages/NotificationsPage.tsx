import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { notificationService, type NotificationDTO } from '@/services/notificationService';

const priorityBadge: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-gray-100 text-gray-500',
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await notificationService.list(100);
      setItems(res.data);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      /* ignore */
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationService.delete(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      /* ignore */
    }
  };

  const filtered = filter === 'unread' ? items.filter((n) => !n.read) : items;
  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">
              All your alerts, enrollment confirmations, waitlist updates, and grade releases.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="shrink-0 h-9 px-3 text-xs font-semibold rounded-lg border border-gray-200 text-campus-800 hover:bg-campus-50 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>
        )}

        <div className="flex items-center gap-1 border-b border-gray-100">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                filter === f
                  ? 'border-campus-800 text-campus-900'
                  : 'border-transparent text-gray-400 hover:text-campus-700'
              }`}
            >
              {f === 'all' ? `All (${items.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
            {filter === 'unread' ? "You're all caught up." : 'No notifications yet.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`bg-white rounded-xl border p-4 flex gap-3 ${
                  n.read ? 'border-gray-100' : 'border-campus-200 bg-campus-50/30'
                }`}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm ${n.read ? 'text-campus-800' : 'font-semibold text-campus-900'}`}>
                      {n.title}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 ${priorityBadge[n.priority]}`}>
                      {n.priority}
                    </span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-campus-600" />}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => !n.read && handleMarkRead(n.id)}
                      className="text-xs font-semibold text-campus-700 hover:text-campus-900 whitespace-nowrap"
                    >
                      Open &rarr;
                    </Link>
                  )}
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-[11px] text-gray-400 hover:text-campus-700"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-[11px] text-gray-400 hover:text-red-500"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
