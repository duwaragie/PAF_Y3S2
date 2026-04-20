import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Logo } from '@/components/Logo';
import NotificationBell from '@/components/NotificationBell';

interface NavLink {
  type: 'link';
  label: string;
  href: string;
  icon: string;
  roles?: string[];
}

interface NavGroup {
  type: 'group';
  label: string;
  icon: string;
  roles?: string[];
  items: NavLink[];
}

type NavEntry = NavLink | NavGroup;

const ICONS = {
  dashboard: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zm-11 0h7v7H3v-7z',
  profile: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
  clipboardCheck: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4',
  clipboard: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
  cap: 'M12 14l9-5-9-5-9 5 9 5zm0 0v8',
  building: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z',
  bus: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 8h6a1 1 0 011 1v3l-2.5 3H13',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
  ticket: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  box: 'M20 7l-8-4-8 4m16 0v10l-8 4m8-14L12 11m0 0L4 7m8 4v10M4 7v10l8 4',
  star: 'M12 2l2.09 6.26L20 9l-5 4.87L16.18 20 12 16.77 7.82 20 9 13.87 4 9l5.91-.74L12 2z',
  alert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  userPlus: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6m3-3h-6',
  compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.24 5.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
  lifeBuoy: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M9.17 14.83l-4.24 4.24',
};

const navEntries: NavEntry[] = [
  { type: 'link', label: 'Dashboard', href: '/dashboard', icon: ICONS.dashboard, roles: ['STUDENT', 'LECTURER', 'ADMIN', 'TECHNICAL_STAFF'] },
  { type: 'link', label: 'Profile', href: '/profile', icon: ICONS.profile },

  // STUDENT groups
  {
    type: 'group',
    label: 'Academics',
    icon: ICONS.cap,
    roles: ['STUDENT'],
    items: [
      { type: 'link', label: 'Browse Courses', href: '/courses', icon: ICONS.book },
      { type: 'link', label: 'My Enrollments', href: '/enrollments', icon: ICONS.clipboardCheck },
      { type: 'link', label: 'Transcript', href: '/transcript', icon: ICONS.clipboard },
    ],
  },
  {
    type: 'group',
    label: 'Campus',
    icon: ICONS.compass,
    roles: ['STUDENT', 'LECTURER'],
    items: [
      { type: 'link', label: 'Campus Facilities', href: '/facilities', icon: ICONS.building },
      { type: 'link', label: 'Shuttle Routes', href: '/dashboard/shuttle', icon: ICONS.bus },
      { type: 'link', label: 'Bookings', href: '/bookings', icon: ICONS.calendar },
    ],
  },

  // LECTURER standalone
  { type: 'link', label: 'My Courses', href: '/lecturer/courses', icon: ICONS.cap, roles: ['LECTURER'] },

  // ADMIN groups
  {
    type: 'group',
    label: 'Facilities',
    icon: ICONS.building,
    roles: ['ADMIN'],
    items: [
      { type: 'link', label: 'All Facilities', href: '/admin/facilities', icon: ICONS.building },
      { type: 'link', label: 'Assets', href: '/admin/assets', icon: ICONS.box },
      { type: 'link', label: 'Amenities', href: '/admin/amenities', icon: ICONS.star },
    ],
  },
  {
    type: 'group',
    label: 'Operations',
    icon: ICONS.compass,
    roles: ['ADMIN'],
    items: [
      { type: 'link', label: 'Shuttles', href: '/admin/shuttle', icon: ICONS.bus },
      { type: 'link', label: 'Courses', href: '/admin/course-offerings', icon: ICONS.cap },
      { type: 'link', label: 'Bookings', href: '/admin/bookings', icon: ICONS.calendar },
    ],
  },
  {
    type: 'group',
    label: 'Users',
    icon: ICONS.users,
    roles: ['ADMIN'],
    items: [
      { type: 'link', label: 'All Users', href: '/admin/users', icon: ICONS.users },
      { type: 'link', label: 'Register', href: '/admin/register-user', icon: ICONS.userPlus },
    ],
  },
  {
    type: 'group',
    label: 'Support',
    icon: ICONS.lifeBuoy,
    roles: ['ADMIN'],
    items: [
      { type: 'link', label: 'Incidents', href: '/admin/incidents', icon: ICONS.alert },
      { type: 'link', label: 'Notifications', href: '/admin/notifications', icon: ICONS.bell },
      { type: 'link', label: 'Audit Log', href: '/admin/audit', icon: ICONS.clipboard },
    ],
  },

  // My Tickets (role-specific routes)
  { type: 'link', label: 'My Tickets', href: '/maintenance/tickets', icon: ICONS.ticket, roles: ['STUDENT', 'LECTURER'] },
  { type: 'link', label: 'My Tickets', href: '/technician/dashboard', icon: ICONS.ticket, roles: ['TECHNICAL_STAFF'] },
];

function matchesRoute(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const role = user?.role || '';

  const visibleEntries = useMemo(
    () =>
      navEntries.filter((entry) => !entry.roles || entry.roles.includes(role)),
    [role]
  );

  const activeGroup = useMemo(() => {
    for (const entry of visibleEntries) {
      if (entry.type === 'group' && entry.items.some((item) => matchesRoute(location.pathname, item.href))) {
        return entry.label;
      }
    }
    return null;
  }, [visibleEntries, location.pathname]);

  const [expanded, setExpanded] = useState<Set<string>>(() => (activeGroup ? new Set([activeGroup]) : new Set()));

  useEffect(() => {
    if (activeGroup) {
      setExpanded((prev) => (prev.has(activeGroup) ? prev : new Set(prev).add(activeGroup)));
    }
  }, [activeGroup]);

  const toggleGroup = (label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="inline-flex hover:opacity-90 transition-opacity">
              <Logo variant="dark" size="sm" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="relative group flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-campus-800 leading-tight">{user?.name}</p>
                <p className="text-[11px] text-gray-400">{user?.role}</p>
              </div>
              <Link to="/profile" aria-label="Open profile">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || 'Profile'}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-campus-100 hover:ring-campus-300 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-campus-600 text-white flex items-center justify-center text-sm font-bold ring-2 ring-campus-100 hover:ring-campus-300 transition-all">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </Link>

              <div className="absolute right-0 top-full pt-3 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible transition-all duration-150">
                <div className="bg-white border border-gray-100 rounded-xl shadow-lg py-2">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-sm font-semibold text-campus-800 truncate">{user?.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-campus-800 hover:bg-campus-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    View profile
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:flex w-[240px] flex-col bg-white border-r border-gray-200 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
          <div className="p-4">
            <nav className="space-y-1">
              {visibleEntries.map((entry) => {
                if (entry.type === 'link') {
                  const active = matchesRoute(location.pathname, entry.href);
                  return (
                    <Link
                      key={entry.href}
                      to={entry.href}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        active ? 'bg-campus-50 text-campus-800 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path d={entry.icon} />
                      </svg>
                      <span className="truncate">{entry.label}</span>
                    </Link>
                  );
                }

                const isOpen = expanded.has(entry.label);
                const hasActiveChild = entry.items.some((item) => matchesRoute(location.pathname, item.href));
                return (
                  <div key={entry.label}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(entry.label)}
                      aria-expanded={isOpen}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        hasActiveChild ? 'text-campus-800 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path d={entry.icon} />
                      </svg>
                      <span className="truncate flex-1 text-left">{entry.label}</span>
                      <svg
                        className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="mt-1 ml-4 pl-3 border-l border-gray-100 space-y-1">
                        {entry.items.map((item) => {
                          const active = matchesRoute(location.pathname, item.href);
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                                active ? 'bg-campus-50 text-campus-800 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                              }`}
                            >
                              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path d={item.icon} />
                              </svg>
                              <span className="truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-4 space-y-1 border-t border-gray-100">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
              </svg>
              Help Center
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto animate-slide-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
