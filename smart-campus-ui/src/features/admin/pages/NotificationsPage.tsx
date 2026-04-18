import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  announcementService,
  type ScheduledAnnouncementDTO,
  type AnnouncementAudience,
  type CreateScheduledAnnouncementRequest,
} from '@/services/announcementService';
import type { NotificationPriority } from '@/services/notificationService';

const audienceStyle: Record<AnnouncementAudience, string> = {
  ALL: 'bg-campus-100 text-campus-700',
  STUDENT: 'bg-blue-100 text-blue-700',
  LECTURER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-red-100 text-red-700',
};

const priorityStyle: Record<NotificationPriority, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-gray-100 text-gray-500',
};

const labelCls = 'text-xs font-medium text-gray-700 mb-1 block';
const inputCls =
  'w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400';

// Rounds the current local time up to the next minute for the scheduledAt default.
function defaultScheduledAt(): string {
  const d = new Date(Date.now() + 5 * 60_000);
  d.setSeconds(0, 0);
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<ScheduledAnnouncementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<CreateScheduledAnnouncementRequest>({
    title: '',
    message: '',
    link: '',
    priority: 'MEDIUM',
    audience: 'ALL',
    scheduledAt: defaultScheduledAt(),
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await announcementService.list();
      setItems(res.data);
    } catch {
      setError('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    try {
      setSubmitting(true);
      await announcementService.create({
        ...form,
        link: form.link?.trim() ? form.link : undefined,
      });
      setForm({
        title: '',
        message: '',
        link: '',
        priority: 'MEDIUM',
        audience: 'ALL',
        scheduledAt: defaultScheduledAt(),
      });
      setShowForm(false);
      await load();
    } catch {
      setError('Failed to schedule announcement. Check that scheduledAt is in the future.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this scheduled announcement?')) return;
    try {
      await announcementService.cancel(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      setError('Failed to cancel — it may have already been sent.');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">Announcements</h1>
            <p className="text-sm text-gray-500 mt-1">
              Schedule system-wide notifications. Each fires at the set time and reaches every user in the audience via their enabled channels.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="h-10 px-5 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 transition-colors"
          >
            {showForm ? 'Close' : '+ Schedule Announcement'}
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
          >
            <div>
              <label className={labelCls}>Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="System maintenance window"
                className={inputCls}
                required
                maxLength={255}
              />
            </div>

            <div>
              <label className={labelCls}>Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="The portal will be unavailable from 2am to 4am for scheduled maintenance."
                className="w-full p-3 rounded-lg border border-gray-200 text-sm min-h-[96px] focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                required
                maxLength={1000}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Audience</label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as AnnouncementAudience }))}
                  className={inputCls}
                >
                  <option value="ALL">Everyone</option>
                  <option value="STUDENT">Students</option>
                  <option value="LECTURER">Lecturers</option>
                  <option value="ADMIN">Admins</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as NotificationPriority }))}
                  className={inputCls}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Send at</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Link (optional)</label>
              <input
                type="text"
                value={form.link || ''}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                placeholder="/facilities or https://..."
                className={inputCls}
                maxLength={255}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-10 px-5 text-sm font-semibold rounded-xl border border-gray-200 text-campus-800 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-10 px-5 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
            No announcements scheduled yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Audience</th>
                  <th className="text-left px-4 py-3">Priority</th>
                  <th className="text-left px-4 py-3">Scheduled</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => {
                  const sent = !!a.sentAt;
                  return (
                    <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-campus-900">{a.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{a.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold rounded px-2 py-0.5 ${audienceStyle[a.audience]}`}>
                          {a.audience}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold rounded px-2 py-0.5 ${priorityStyle[a.priority]}`}>
                          {a.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(a.scheduledAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {sent ? (
                          <span className="text-xs text-green-700 font-semibold">
                            Sent{a.recipientCount != null ? ` · ${a.recipientCount}` : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 font-semibold">Scheduled</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!sent && (
                          <button
                            onClick={() => handleCancel(a.id)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
