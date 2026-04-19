import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { bookingService, type BookingDTO } from '@/services/bookingService';
import { dashboardService, type LecturerDashboardSummary } from '@/services/dashboardService';
import { ticketService, type TicketDTO } from '@/services/ticketService';
import { notificationService } from '@/services/notificationService';

export default function LecturerDashboard() {
  const user = useAuthStore((s) => s.user);
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [academics, setAcademics] = useState<LecturerDashboardSummary | null>(null);
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    bookingService.getMyBookings(undefined, 0, 100)
      .then((res) => setBookings(res.data.content))
      .catch(() => setBookings([]));
    dashboardService.lecturerSummary()
      .then((res) => setAcademics(res.data))
      .catch(() => setAcademics(null));
    ticketService.getAll()
      .then((res) => setTickets(res.data))
      .catch(() => setTickets([]));
    notificationService.unreadCount()
      .then((res) => setUnreadNotifications(res.data.count))
      .catch(() => setUnreadNotifications(0));
  }, []);

  const pendingCount = useMemo(() => bookings.filter((b) => b.status === 'PENDING').length, [bookings]);
  const approvedUpcoming = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((b) => b.status === 'APPROVED' && new Date(b.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [bookings]);
  const myTickets = useMemo(
    () => (user ? tickets.filter((t) => t.createdById === user.id) : []),
    [tickets, user],
  );
  const openMyTickets = useMemo(
    () => myTickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    [myTickets],
  );

  const stats = [
    {
      label: 'My Bookings',
      value: String(bookings.length),
      desc: 'All booking requests you have submitted.',
      color: 'bg-purple-50 text-purple-700',
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
        <div className="flex items-center gap-2.5 mb-1">
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-purple-600 text-white">LECTURER</span>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Faculty Dashboard</span>
        </div>
        <h1 className="text-[1.75rem] font-bold text-campus-900 mt-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Reserve lecture halls and labs, review your upcoming sessions, and manage pending requests.</p>
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

      {/* Teaching load */}
      <div>
        <h2 className="text-sm font-bold text-campus-900 mb-3 uppercase tracking-wider text-[11px]">Teaching Load</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Sections in charge',
              value: String(academics?.sectionsInCharge ?? 0),
              desc: `${academics?.offeringsInCharge ?? 0} module${academics?.offeringsInCharge === 1 ? '' : 's'} across ${academics?.sectionsInCharge ?? 0} section${academics?.sectionsInCharge === 1 ? '' : 's'}.`,
              color: 'bg-campus-50 text-campus-700',
              iconPath: 'M12 14l9-5-9-5-9 5 9 5zm0 0v8',
              link: '/lecturer/courses',
            },
            {
              label: 'Total students',
              value: String(academics?.totalStudents ?? 0),
              desc: 'Across every section you lead.',
              color: 'bg-purple-50 text-purple-700',
              iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
              link: '/lecturer/courses',
            },
            {
              label: 'Pending grades',
              value: String(academics?.pendingGrades ?? 0),
              desc: 'Students awaiting a grade.',
              color: 'bg-amber-50 text-amber-700',
              iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
              link: '/lecturer/courses',
            },
            {
              label: 'Ready to release',
              value: String(academics?.gradedPendingRelease ?? 0),
              desc: 'Grades set, pending release.',
              color: 'bg-emerald-50 text-emerald-700',
              iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
              link: '/lecturer/courses',
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
        {academics && academics.courseCodes && academics.courseCodes.length > 0 && (
          <p className="text-[11px] text-gray-400 mt-3">
            Courses: <span className="font-mono text-campus-700">{academics.courseCodes.join(', ')}</span>
          </p>
        )}
      </div>

      {/* Campus Services */}
      <div>
        <h2 className="text-sm font-bold text-campus-900 mb-3 uppercase tracking-wider text-[11px]">Campus Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              label: 'My Tickets',
              value: String(myTickets.length),
              desc: `${openMyTickets} open or in progress.`,
              color: 'bg-rose-50 text-rose-700',
              iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
              link: '/maintenance/tickets',
            },
            {
              label: 'Unread Notifications',
              value: String(unreadNotifications),
              desc: 'New alerts awaiting your review.',
              color: 'bg-blue-50 text-blue-700',
              iconPath: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
              link: '/notifications',
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
