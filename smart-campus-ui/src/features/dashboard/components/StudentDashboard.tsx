import { useAuthStore } from '@/store/authStore';

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);

  const stats = [
    { label: 'My Bookings', value: '—', desc: 'Active reservations for labs and libraries.', color: 'bg-campus-50 text-campus-700' },
    { label: 'Open Tickets', value: '—', desc: 'Support requests awaiting review.', color: 'bg-amber-50 text-amber-700' },
    { label: 'Notifications', value: '—', desc: 'New updates from courses and faculty.', color: 'bg-blue-50 text-blue-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.75rem] font-bold text-campus-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Your academic curriculum is up to date. Explore your dashboard to manage bookings, tickets, and more.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-soft transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {stat.label === 'My Bookings' && <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />}
                  {stat.label === 'Open Tickets' && <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>}
                  {stat.label === 'Notifications' && <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />}
                </svg>
              </div>
              <span className="text-3xl font-extrabold text-campus-900">{stat.value}</span>
            </div>
            <p className="text-sm font-semibold text-campus-800">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
