import React from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import VerifyOtpPage from './features/auth/pages/VerifyOtpPage';
import OAuthRedirectHandler from './features/auth/pages/OAuthRedirectHandler';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import { useAuthStore } from './store/authStore';
import { Logo } from './components/Logo';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactElement }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

/* ─── Dashboard ───────────────────────────────────────────── */
function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const roleBadge: Record<string, { bg: string; text: string }> = {
    STUDENT: { bg: 'bg-campus-600', text: 'text-white' },
    LECTURER: { bg: 'bg-purple-600', text: 'text-white' },
    ADMIN: { bg: 'bg-red-600', text: 'text-white' },
  };
  const badge = roleBadge[user?.role || 'STUDENT'] || roleBadge.STUDENT;

  const navItems = [
    { label: 'Overview', icon: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zm-11 0h7v7H3v-7z', active: true },
    { label: 'Academic Records', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
    { label: 'Faculty Hub', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    { label: 'Financials', icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z' },
    { label: 'Library', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z' },
    { label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
  ];

  const stats = [
    { label: 'My Bookings', value: '—', desc: 'Active reservations for labs and libraries.', color: 'bg-campus-50 text-campus-700' },
    { label: 'Open Tickets', value: '—', desc: 'Support requests awaiting administrative review.', color: 'bg-amber-50 text-amber-700' },
    { label: 'Notifications', value: '—', desc: 'New updates from your courses and faculty.', color: 'bg-blue-50 text-blue-700' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo variant="dark" size="sm" />
            <nav className="hidden md:flex items-center gap-1">
              {['Dashboard', 'Courses', 'Research', 'Campus'].map((item, i) => (
                <span
                  key={item}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${i === 0 ? 'text-campus-800 bg-campus-50 font-semibold' : 'text-gray-500 hover:text-campus-700 hover:bg-gray-50'}`}
                >
                  {item}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification icons */}
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 4L12 13L2 4" />
              </svg>
            </button>
            {/* User */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-campus-800 leading-tight">{user?.name}</p>
                <p className="text-[11px] text-gray-400">ID: {user?.id}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-campus-600 text-white flex items-center justify-center text-sm font-bold ring-2 ring-campus-100">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-[220px] flex-col bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] sticky top-16">
          <div className="p-4">
            {/* Status card */}
            <div className="flex items-center gap-3 p-3 bg-campus-50 rounded-xl mb-6">
              <div className="w-10 h-10 rounded-full bg-campus-600 text-white flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-campus-500 font-semibold uppercase tracking-wider">Current Status</p>
                <p className="text-sm font-bold text-campus-800">Active {user?.role === 'STUDENT' ? 'Student' : user?.role === 'LECTURER' ? 'Faculty' : 'Admin'}</p>
              </div>
            </div>

            {/* Nav items */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${item.active ? 'bg-campus-50 text-campus-800 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                >
                  <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Bottom actions */}
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
        <main className="flex-1 p-6 lg:p-8 max-w-[1100px]">
          <div className="animate-slide-up space-y-6">
            {/* Welcome header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${badge.bg} ${badge.text}`}>
                    {user?.role}
                  </span>
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Spring Semester {new Date().getFullYear()}
                  </span>
                </div>
                <h1 className="text-[1.75rem] font-bold text-campus-900 mt-1">
                  Welcome back, {user?.name?.split(' ')[0]}
                </h1>
                <p className="text-gray-500 text-sm mt-1 max-w-lg">
                  Your academic curriculum is up to date. Explore your dashboard to manage bookings, tickets, and more.
                </p>
              </div>
            </div>

            {/* Stats cards */}
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

            {/* Account Details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-campus-900">Account Details</h2>
                <button className="text-sm font-semibold text-campus-600 hover:text-campus-500 transition-colors">
                  Edit Profile
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: 'Email Address', value: user?.email, icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6' },
                  { label: 'Institutional Role', value: user?.role, icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
                  {
                    label: 'Auth Provider',
                    value: user?.authProvider,
                    icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
                    badge: true,
                  },
                  {
                    label: 'Verification Status',
                    value: user?.isEmailVerified ? 'Verified Academic Identity' : 'Pending Verification',
                    icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
                    verified: user?.isEmailVerified,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80">
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path d={item.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.verified !== undefined && (
                          <span className={`w-2 h-2 rounded-full ${item.verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        )}
                        <p className="text-sm font-semibold text-campus-800 capitalize">
                          {typeof item.value === 'string' ? item.value?.toLowerCase() : item.value}
                        </p>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-campus-100 text-campus-600 rounded">
                            {user?.authProvider}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile logout */}
            <div className="lg:hidden">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── App Routes ──────────────────────────────────────────── */
function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify" element={<PublicRoute><VerifyOtpPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route path="/oauth2/redirect" element={<OAuthRedirectHandler />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
