import AppLayout from '@/components/layout/AppLayout';

const tickets = [
  { id: 'TKT-001', title: 'Broken projector in Lab 101', reporter: 'Jane Smith', category: 'Equipment', priority: 'HIGH', status: 'OPEN', assignedTo: 'Unassigned' },
  { id: 'TKT-002', title: 'AC not working in B-201', reporter: 'Dr. Perera', category: 'Facility', priority: 'MEDIUM', status: 'IN_PROGRESS', assignedTo: 'John Technician' },
  { id: 'TKT-003', title: 'Network issues in Library', reporter: 'Student User', category: 'IT', priority: 'LOW', status: 'RESOLVED', assignedTo: 'IT Support' },
];

const priorityStyle: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-blue-100 text-blue-700',
};

const statusStyle: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

export default function IncidentsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">Incident Ticketing</h1>
            <p className="text-sm text-gray-500 mt-1">View, assign, and manage maintenance and incident tickets.</p>
          </div>
          <button className="h-10 px-5 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 transition-colors">
            + New Ticket
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
                  {['Ticket ID', 'Title', 'Reporter', 'Category', 'Priority', 'Status', 'Assigned To', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono text-gray-500">{t.id}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-campus-800">{t.title}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{t.reporter}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{t.category}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${priorityStyle[t.priority]}`}>{t.priority}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusStyle[t.status]}`}>{t.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{t.assignedTo}</td>
                    <td className="px-5 py-4 flex gap-2">
                      <button className="text-xs font-semibold text-campus-600 hover:text-campus-700">View</button>
                      <button className="text-xs font-semibold text-purple-600 hover:text-purple-700">Assign</button>
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
