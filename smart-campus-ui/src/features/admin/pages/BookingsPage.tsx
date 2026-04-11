import AppLayout from '@/components/layout/AppLayout';

const bookings = [
  { id: 'BKG-001', facility: 'Computer Lab 101', requestedBy: 'Jane Smith', dateTime: '2026-04-15 09:00–11:00', status: 'PENDING' },
  { id: 'BKG-002', facility: 'Lecture Hall B-201', requestedBy: 'Dr. Perera', dateTime: '2026-04-16 14:00–16:00', status: 'APPROVED' },
  { id: 'BKG-003', facility: 'Meeting Room C-101', requestedBy: 'Student Council', dateTime: '2026-04-14 10:00–12:00', status: 'REJECTED' },
];

const statusStyle: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export default function BookingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">Booking Management</h1>
            <p className="text-sm text-gray-500 mt-1">Review, approve, or reject facility booking requests.</p>
          </div>
          <button className="h-10 px-5 bg-white border border-gray-200 text-sm font-semibold text-campus-800 rounded-xl hover:bg-gray-50 transition-colors">
            Filter
          </button>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" /></svg>
          This module is under development. The interface below is a preview scaffold.
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Booking ID', 'Facility', 'Requested By', 'Date & Time', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono text-gray-500">{b.id}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-campus-800">{b.facility}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{b.requestedBy}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{b.dateTime}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusStyle[b.status]}`}>{b.status}</span>
                    </td>
                    <td className="px-5 py-4 flex gap-2">
                      {b.status === 'PENDING' && (
                        <>
                          <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Approve</button>
                          <button className="text-xs font-semibold text-red-500 hover:text-red-700">Reject</button>
                        </>
                      )}
                      {b.status !== 'PENDING' && <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
