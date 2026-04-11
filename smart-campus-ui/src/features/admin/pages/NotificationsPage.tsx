import AppLayout from '@/components/layout/AppLayout';

const notifications = [
  { id: 1, title: 'Scheduled Maintenance — Block A', body: 'Block A will undergo electrical maintenance on April 20. All labs will be closed from 08:00 to 17:00.', audience: 'All', status: 'Sent', sentAt: '2026-04-10' },
  { id: 2, title: 'New Booking Policy Update', body: 'Starting May 1, all bookings must be made at least 48 hours in advance. Same-day bookings require admin approval.', audience: 'Students', status: 'Draft', sentAt: null },
  { id: 3, title: 'Faculty Meeting — End of Semester', body: 'All lecturers are requested to attend the end-of-semester review meeting on April 25 at 10:00 in Hall C-301.', audience: 'Lecturers', status: 'Sent', sentAt: '2026-04-08' },
];

const audienceStyle: Record<string, string> = {
  All: 'bg-campus-100 text-campus-700',
  Students: 'bg-blue-100 text-blue-700',
  Lecturers: 'bg-purple-100 text-purple-700',
};

export default function NotificationsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">Notification Management</h1>
            <p className="text-sm text-gray-500 mt-1">Compose and manage platform-wide notifications.</p>
          </div>
          <button className="h-10 px-5 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 transition-colors">
            + Compose Notification
          </button>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" /></svg>
          This module is under development. The interface below is a preview scaffold.
        </div>

        <div className="space-y-4">
          {notifications.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-campus-900">{n.title}</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${audienceStyle[n.audience]}`}>{n.audience}</span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${n.status === 'Sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {n.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{n.body}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">{n.sentAt ? `Sent on ${n.sentAt}` : 'Not sent yet'}</span>
                <div className="flex gap-2">
                  <button className="text-xs font-semibold text-campus-600 hover:text-campus-700">Edit</button>
                  {n.status === 'Draft' && (
                    <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Send</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
