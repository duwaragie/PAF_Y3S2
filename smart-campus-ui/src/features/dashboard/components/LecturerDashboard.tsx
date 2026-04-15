import { useAuthStore } from '@/store/authStore';

export default function LecturerDashboard() {
  const user = useAuthStore((s) => s.user);

  const stats = [
    { label: 'My Courses', value: '0', desc: 'Courses assigned this semester.', color: 'bg-purple-50 text-purple-700' },
    { label: 'Assigned Tickets', value: '0', desc: 'Maintenance tickets awaiting your action.', color: 'bg-amber-50 text-amber-700' },
    { label: 'Upcoming Classes', value: '0', desc: 'Scheduled sessions this week.', color: 'bg-campus-50 text-campus-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-purple-600 text-white">LECTURER</span>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Faculty Dashboard</span>
        </div>
        <h1 className="text-[1.75rem] font-bold text-campus-900 mt-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your courses, review assigned tickets, and check your schedule.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-soft transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {stat.label === 'My Courses' && <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z" />}
                  {stat.label === 'Assigned Tickets' && <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>}
                  {stat.label === 'Upcoming Classes' && <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />}
                </svg>
              </div>
              <span className="text-3xl font-extrabold text-campus-900">{stat.value}</span>
            </div>
            <p className="text-sm font-semibold text-campus-800">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Teaching Load Placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-campus-900 mb-4">My Teaching Load</h2>
        <div className="text-sm text-gray-400 text-center py-8">No courses assigned yet. Course data will appear here once modules are active.</div>
      </div>
    </div>
  );
}
