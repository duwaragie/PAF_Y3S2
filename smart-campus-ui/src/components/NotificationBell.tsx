import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationService, type NotificationDTO } from '@/services/notificationService';
import { notificationSocket } from '@/lib/notificationSocket';

const priorityAccent: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-gray-300',
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
  return `${Math.round(diffSec / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void refreshCount();
    // WebSocket is the primary source of truth — poll every 2 minutes as a safety net
    // for missed frames (reconnects, transient network blips).
    const interval = setInterval(() => void refreshCount(), 120_000);
    return () => clearInterval(interval);
  }, []);

  // Live updates over WebSocket — prepend to the open dropdown and bump the badge.
  useEffect(() => {
    const unsubscribe = notificationSocket.subscribe((incoming) => {
      setUnread((prev) => prev + 1);
      setItems((prev) => {
        if (prev.some((x) => x.id === incoming.id)) return prev;
        return [incoming, ...prev].slice(0, 10);
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadList();
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const refreshCount = async () => {
    try {
      const res = await notificationService.unreadCount();
      setUnread(res.data.count);
    } catch {
      /* ignore */
    }
  };

  const loadList = async () => {
    try {
      setLoading(true);
      const res = await notificationService.list(10);
      setItems(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (n: NotificationDTO) => {
    try {
      if (!n.read) {
        await notificationService.markRead(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        setUnread((prev) => Math.max(0, prev - 1));
      }
    } catch {
      /* non-blocking */
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-campus-900">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-[11px] font-semibold text-campus-700 hover:text-campus-900"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-10 flex justify-center">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-campus-600 rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 px-4 text-center text-sm text-gray-400">
                You're all caught up.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors flex gap-3 ${
                    !n.read ? 'bg-campus-50/40' : ''
                  }`}
                >
                  <span className={`shrink-0 mt-1.5 w-2 h-2 rounded-full ${priorityAccent[n.priority] || 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-campus-900' : 'text-campus-800'} truncate`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-gray-100">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center px-4 py-2.5 text-xs font-semibold text-campus-700 hover:text-campus-900 hover:bg-gray-50 transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
