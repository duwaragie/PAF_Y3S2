import { useState, useEffect } from 'react';
import { adminService, type UserDTO } from '@/services/adminService';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';

const ROLES = ['STUDENT', 'LECTURER', 'ADMIN'] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminService.getAllUsers();
      setUsers(res.data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      setUpdatingId(userId);
      const res = await adminService.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
    } catch {
      setError('Failed to update role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignIdentifier = async (user: UserDTO) => {
    const isStudent = user.role === 'STUDENT';
    const label = isStudent ? 'Student Registration Number' : 'Employee ID';
    const current = isStudent ? user.studentRegistrationNumber : user.employeeId;
    const input = window.prompt(`${label} for ${user.name}:`, current || '');
    if (input === null) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      setUpdatingId(user.id);
      const payload = isStudent
        ? { studentRegistrationNumber: trimmed }
        : { employeeId: trimmed };
      const res = await adminService.assignIdentifier(user.id, payload);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to assign identifier.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId: number) => {
    if (userId === currentUser?.id) return;
    try {
      setUpdatingId(userId);
      await adminService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setError('Failed to delete user.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage all registered users, roles, and permissions.</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Identifier</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-campus-600 text-white flex items-center justify-center text-sm font-bold">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-campus-800">{user.name}</p>
                              <p className="text-[11px] text-gray-400">ID: {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-5 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={updatingId === user.id || user.id === currentUser?.id}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-campus-800 font-medium focus:outline-none focus:ring-2 focus:ring-campus-200 disabled:opacity-50"
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          {(() => {
                            const isStudent = user.role === 'STUDENT';
                            const value = isStudent ? user.studentRegistrationNumber : user.employeeId;
                            return (
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-mono ${value ? 'text-campus-800' : 'text-gray-300'}`}>
                                  {value || '—'}
                                </span>
                                <button
                                  onClick={() => handleAssignIdentifier(user)}
                                  disabled={updatingId === user.id}
                                  className="text-xs text-campus-600 hover:text-campus-800 font-medium disabled:opacity-30 transition-colors"
                                >
                                  {value ? 'Edit' : 'Assign'}
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={updatingId === user.id || user.id === currentUser?.id}
                            className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400">
                {users.length} user{users.length !== 1 ? 's' : ''} total
              </div>
            </div>
          )}
        </div>
    </AppLayout>
  );
}
