import type { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Logo } from '@/components/Logo';
import NotificationBell from '@/components/NotificationBell';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zm-11 0h7v7H3v-7z' },
  { label: 'Profile', href: '/profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  { label: 'Browse Courses', href: '/courses', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z', roles: ['STUDENT'] },
  { label: 'My Enrollments', href: '/enrollments', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4', roles: ['STUDENT'] },
  { label: 'Transcript', href: '/transcript', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2', roles: ['STUDENT'] },
  { label: 'My Courses', href: '/lecturer/courses', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0v8', roles: ['LECTURER'] },
  { label: 'Campus Facilities', href: '/facilities', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z', roles: ['STUDENT', 'LECTURER'] },
  { label: 'Bookings', href: '/bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z', roles: ['STUDENT', 'LECTURER'] },
  { label: 'Manage Facilities', href: '/admin/facilities', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', roles: ['ADMIN'] }, // Admin only
  { label: 'Manage Assets', href: '/admin/assets', icon: 'M20 7l-8-4-8 4m16 0v10l-8 4m8-14L12 11m0 0L4 7m8 4v10M4 7v10l8 4', roles: ['ADMIN'] },
  { label: 'Manage Amenities', href: '/admin/amenities', icon: 'M12 2l2.09 6.26L20 9l-5 4.87L16.18 20 12 16.77 7.82 20 9 13.87 4 9l5.91-.74L12 2z', roles: ['ADMIN'] },
  { label: 'Course Offerings', href: '/admin/course-offerings', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 0 1 .665 6.479A11.952 11.952 0 0 0 12 20.055a11.952 11.952 0 0 0-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14z', roles: ['ADMIN'] },
  { label: 'Manage Bookings', href: '/admin/bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z', roles: ['ADMIN'] },
  { label: 'Incidents', href: '/admin/incidents', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01', roles: ['ADMIN'] },
  { label: 'Notifications', href: '/admin/notifications', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0', roles: ['ADMIN'] },
  { label: 'User Management', href: '/admin/users', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', roles: ['ADMIN'] },
  { label: 'Register User', href: '/admin/register-user', icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6m3-3h-6', roles: ['ADMIN'] },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();

  const visibleNav = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || '')
  );

  const isActive = (href: string) =>
    href === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="inline-flex hover:opacity-90 transition-opacity">
              <Logo variant="dark" size="sm" />
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {['Dashboard', 'Courses', 'Research', 'Campus'].map((item, i) => (
                <Link
                  key={item}
                  to={i === 0 ? '/dashboard' : '#'}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${i === 0 ? 'text-campus-800 bg-campus-50 font-semibold' : 'text-gray-500 hover:text-campus-700 hover:bg-gray-50'}`}
                >
                  {item}
                </Link>
              ))}
            </nav>
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

              {/* Hover dropdown */}
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
        {/* Sidebar */}
        <aside className="hidden lg:flex w-[220px] flex-col bg-white border-r border-gray-200 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center gap-3 p-3 bg-campus-50 rounded-xl mb-6">
              <div className="w-10 h-10 rounded-full bg-campus-600 text-white flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-campus-500 font-semibold uppercase tracking-wider">Current Status</p>
                <p className="text-sm font-bold text-campus-800">
                  Active {user?.role === 'STUDENT' ? 'Student' : user?.role === 'LECTURER' ? 'Faculty' : 'Admin'}
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {visibleNav.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive(item.href) ? 'bg-campus-50 text-campus-800 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                >
                  <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              ))}
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

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto animate-slide-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
