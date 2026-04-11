import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { adminService, type UserDTO } from '@/services/adminService';

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<UserDTO[]>([]);

  useEffect(() => {
    adminService.getAllUsers().then((res) => setUsers(res.data)).catch(() => {});
  }, []);

  const stats = [
    { label: 'Total Users', value: String(users.length || '—'), desc: 'Registered accounts across all roles.', color: 'bg-campus-50 text-campus-700' },
    { label: 'Pending Bookings', value: '—', desc: 'Booking requests awaiting approval.', color: 'bg-amber-50 text-amber-700' },
    { label: 'Open Incidents', value: '—', desc: 'Active incident tickets.', color: 'bg-red-50 text-red-700' },
    { label: 'System Health', value: 'OK', desc: 'All services running normally.', color: 'bg-emerald-50 text-emerald-700' },
  ];

  const quickActions = [
    { label: 'Register User', href: '/admin/register-user', icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6m3-3h-6' },
    { label: 'Manage Facilities', href: '/admin/facilities', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z' },
    { label: 'View Bookings', href: '/admin/bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z' },
    { label: 'View Incidents', href: '/admin/incidents', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01' },
  ];

  const roleBadge: Record<string, string> = {
    STUDENT: 'bg-campus-100 text-campus-700',
    LECTURER: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-red-600 text-white">ADMIN</span>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">System Administration</span>
        </div>
        <h1 className="text-[1.75rem] font-bold text-campus-900 mt-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Oversee platform operations, manage users, and review pending requests.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-soft transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                </svg>
              </div>
              <span className="text-2xl font-extrabold text-campus-900">{stat.value}</span>
            </div>
            <p className="text-sm font-semibold text-campus-800">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-campus-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-campus-200 hover:bg-campus-50/50 transition-all text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-campus-50 text-campus-700 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d={action.icon} />
                </svg>
              </div>
              <span className="text-sm font-semibold text-campus-800">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-campus-900">Recent Users</h2>
          <Link to="/admin/users" className="text-sm font-semibold text-campus-600 hover:text-campus-500">View All</Link>
        </div>
        <div className="space-y-3">
          {users.slice(0, 5).map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-campus-600 text-white flex items-center justify-center text-sm font-bold">
                  {u.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-campus-800">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${roleBadge[u.role] || roleBadge.STUDENT}`}>
                {u.role}
              </span>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Loading users...</p>
          )}
        </div>
      </div>
    </div>
  );
}
