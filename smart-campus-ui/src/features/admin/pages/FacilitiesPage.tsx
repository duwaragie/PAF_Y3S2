import AppLayout from '@/components/layout/AppLayout';

const facilities = [
  { id: 'FAC-001', name: 'Computer Lab 101', type: 'Lab', capacity: 30, location: 'Block A, Floor 1', status: 'ACTIVE' },
  { id: 'FAC-002', name: 'Lecture Hall B-201', type: 'Room', capacity: 120, location: 'Block B, Floor 2', status: 'ACTIVE' },
  { id: 'FAC-003', name: 'Projector Unit #5', type: 'Equipment', capacity: 1, location: 'IT Store', status: 'OUT_OF_SERVICE' },
];

const statusStyle: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  OUT_OF_SERVICE: 'bg-red-100 text-red-700',
};

export default function FacilitiesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">Facilities & Assets Catalogue</h1>
            <p className="text-sm text-gray-500 mt-1">Manage bookable resources: lecture halls, labs, meeting rooms, and equipment.</p>
          </div>
          <button className="h-10 px-5 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 transition-colors">
            + Add Facility
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
                  {['ID', 'Name', 'Type', 'Capacity', 'Location', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facilities.map((f) => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono text-gray-500">{f.id}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-campus-800">{f.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{f.type}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{f.capacity}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{f.location}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusStyle[f.status]}`}>{f.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-campus-600 font-medium">Edit</td>
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
