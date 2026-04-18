import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { bookingService, type BookingDTO } from '@/services/bookingService';
import { dashboardService, type StudentDashboardSummary } from '@/services/dashboardService';

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [academics, setAcademics] = useState<StudentDashboardSummary | null>(null);

  useEffect(() => {
    // Pull a larger page so we can split by status client-side for dashboard stats.
    bookingService.getMyBookings(undefined, 0, 100)
      .then((res) => setBookings(res.data.content))
      .catch(() => setBookings([]));
    dashboardService.studentSummary()
      .then((res) => setAcademics(res.data))
      .catch(() => setAcademics(null));
  }, []);

  const pendingCount = useMemo(() => bookings.filter((b) => b.status === 'PENDING').length, [bookings]);
  const approvedUpcoming = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((b) => b.status === 'APPROVED' && new Date(b.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [bookings]);

  const stats = [
    {
      label: 'My Bookings',
      value: String(bookings.length),
      desc: 'All booking requests you have submitted.',
      color: 'bg-campus-50 text-campus-700',
      iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
    },
    {
      label: 'Pending Approval',
      value: String(pendingCount),
      desc: 'Requests waiting for admin review.',
      color: 'bg-amber-50 text-amber-700',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Upcoming Bookings',
      value: String(approvedUpcoming.length),
      desc: 'Approved bookings on your calendar.',
      color: 'bg-emerald-50 text-emerald-700',
      iconPath: 'M5 13l4 4L19 7',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.75rem] font-bold text-campus-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Browse facilities, book spaces, and keep track of your reservations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-soft transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.iconPath} />
                </svg>
              </div>
              <span className="text-3xl font-extrabold text-campus-900">{stat.value}</span>
            </div>
            <p className="text-sm font-semibold text-campus-800">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Academics */}
      <div>
        <h2 className="text-sm font-bold text-campus-900 mb-3 uppercase tracking-wider text-[11px]">Academics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Enrolled Modules',
              value: String(academics?.activeEnrollments ?? 0),
              desc: 'Sections you are currently in.',
              color: 'bg-campus-50 text-campus-700',
              iconPath: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z',
              link: '/enrollments',
            },
            {
              label: 'Waitlisted',
              value: String(academics?.waitlisted ?? 0),
              desc: 'Sections you are on a waitlist for.',
              color: 'bg-amber-50 text-amber-700',
              iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
              link: '/enrollments',
            },
            {
              label: 'Cumulative GPA',
              value: (academics?.gpa ?? 0).toFixed(2),
              desc: `${academics?.coursesCompleted ?? 0} course${academics?.coursesCompleted === 1 ? '' : 's'} completed.`,
              color: 'bg-emerald-50 text-emerald-700',
              iconPath: 'M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z',
              link: '/transcript',
            },
            {
              label: 'Credits Earned',
              value: (academics?.creditsEarned ?? 0).toFixed(1),
              desc: 'Across all completed courses.',
              color: 'bg-purple-50 text-purple-700',
              iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
              link: '/transcript',
            },
          ].map((stat) => (
            <Link
              to={stat.link}
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-soft transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.iconPath} />
                  </svg>
                </div>
                <span className="text-2xl font-extrabold text-campus-900">{stat.value}</span>
              </div>
              <p className="text-xs font-semibold text-campus-800">{stat.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{stat.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-campus-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/facilities" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-campus-200 hover:bg-campus-50/50 transition-all text-center">
              <div className="w-10 h-10 rounded-xl bg-campus-50 text-campus-700 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-campus-800">Browse Facilities</span>
            </Link>
            <Link to="/bookings" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-campus-200 hover:bg-campus-50/50 transition-all text-center">
              <div className="w-10 h-10 rounded-xl bg-campus-50 text-campus-700 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-campus-800">My Bookings</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-campus-900">Upcoming Bookings</h2>
            <Link to="/bookings" className="text-sm font-semibold text-campus-600 hover:text-campus-500">View All</Link>
          </div>
          <div className="space-y-3">
            {approvedUpcoming.slice(0, 3).map((b) => (
              <div key={b.id} className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100">
                <p className="text-sm font-semibold text-campus-800 truncate">
                  {b.resourceName}
                  {b.locationName && <span className="font-normal text-gray-500"> · {b.locationName}</span>}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(b.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} – {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
            {approvedUpcoming.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No upcoming bookings.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
