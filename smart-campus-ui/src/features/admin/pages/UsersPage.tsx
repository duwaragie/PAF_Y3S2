import { useState, useEffect } from 'react';
import { adminService, type UserDTO } from '@/services/adminService';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';

const ROLES = ['STUDENT', 'LECTURER', 'ADMIN'] as const;

type ConfirmState =
  | { kind: 'delete'; userId: number; userName: string }
  | { kind: 'bulk-delete'; ids: number[] }
  | null;

export default function UsersPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [manageUser, setManageUser] = useState<UserDTO | null>(null);
  const [manageRole, setManageRole] = useState<string>('');
  const [manageIdentifier, setManageIdentifier] = useState<string>('');
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageSaving, setManageSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
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

  const openManage = (user: UserDTO) => {
    setManageUser(user);
    setManageRole(user.role);
    const current = user.role === 'STUDENT' ? user.studentRegistrationNumber : user.employeeId;
    setManageIdentifier(current || '');
    setManageError(null);
  };

  const closeManage = () => {
    setManageUser(null);
    setManageRole('');
    setManageIdentifier('');
    setManageError(null);
  };

  const saveManage = async () => {
    if (!manageUser) return;
    const isSelf = manageUser.id === currentUser?.id;
    const trimmedIdentifier = manageIdentifier.trim();
    const currentIdentifier =
      manageUser.role === 'STUDENT' ? manageUser.studentRegistrationNumber : manageUser.employeeId;
    const identifierChanged = trimmedIdentifier !== (currentIdentifier || '');
    const roleChanged = manageRole !== manageUser.role;

    try {
      setManageSaving(true);
      setManageError(null);
      let updated = manageUser;

      if (roleChanged && !isSelf) {
        const res = await adminService.updateUserRole(manageUser.id, manageRole);
        updated = res.data;
      }

      if (identifierChanged && trimmedIdentifier) {
        const effectiveRole = roleChanged ? manageRole : manageUser.role;
        const payload =
          effectiveRole === 'STUDENT'
            ? { studentRegistrationNumber: trimmedIdentifier }
            : { employeeId: trimmedIdentifier };
        const res = await adminService.assignIdentifier(manageUser.id, payload);
        updated = res.data;
      }

      setUsers((prev) => prev.map((u) => (u.id === manageUser.id ? updated : u)));
      closeManage();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setManageError(e.response?.data?.message || 'Failed to save changes.');
    } finally {
      setManageSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (userId === currentUser?.id) return;
    try {
      setUpdatingId(userId);
      await adminService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    } catch {
      setError('Failed to delete user.');
    } finally {
      setUpdatingId(null);
      setConfirm(null);
    }
  };

  const handleBulkDelete = async (ids: number[]) => {
    try {
      setBulkDeleting(true);
      await adminService.bulkDeleteUsers(ids);
      const idSet = new Set(ids);
      setUsers((prev) => prev.filter((u) => !idSet.has(u.id)));
      setSelectedIds(new Set());
    } catch {
      setError('Failed to delete selected users.');
    } finally {
      setBulkDeleting(false);
      setConfirm(null);
    }
  };

  const toggleSelect = (id: number) => {
    if (id === currentUser?.id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectableIds = users.filter((u) => u.id !== currentUser?.id).map((u) => u.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(selectableIds));
  };

  const identifierLabelFor = (role: string) =>
    role === 'STUDENT' ? 'Student Registration Number' : 'Employee ID';
  const identifierPlaceholderFor = (role: string) =>
    role === 'STUDENT' ? 'IT22123456' : 'EMP-0001';

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-campus-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage all registered users, roles, and permissions.
          </p>
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

        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-campus-50 border border-campus-100">
            <p className="text-sm font-medium text-campus-800">
              {selectedIds.size} user{selectedIds.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm font-medium text-gray-500 hover:text-campus-800 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setConfirm({ kind: 'bulk-delete', ids: Array.from(selectedIds) })}
                disabled={bulkDeleting}
                className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
              >
                Delete selected
              </button>
            </div>
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
                    <th className="px-4 py-3.5 w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all users"
                        className="w-4 h-4 rounded border-gray-300 text-campus-600 focus:ring-campus-200 cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Identifier</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isStudent = user.role === 'STUDENT';
                    const identifier = isStudent ? user.studentRegistrationNumber : user.employeeId;
                    const isBusy = updatingId === user.id;
                    const isSelf = user.id === currentUser?.id;
                    const isSelected = selectedIds.has(user.id);

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-50 transition-colors ${
                          isSelected ? 'bg-campus-50/40' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(user.id)}
                            disabled={isSelf}
                            aria-label={`Select ${user.name}`}
                            className="w-4 h-4 rounded border-gray-300 text-campus-600 focus:ring-campus-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-campus-600 text-white flex items-center justify-center text-sm font-bold">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-campus-800">{user.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-5 py-4">
                          <span className="inline-block px-2.5 py-1 text-[11px] font-semibold rounded-md bg-gray-100 text-campus-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {identifier ? (
                            <span className="text-sm font-mono text-campus-800">{identifier}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold rounded-md bg-red-50 text-red-600 border border-red-100">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4m0 4h.01" />
                              </svg>
                              Missing, needs action
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openManage(user)}
                              disabled={isBusy}
                              className="text-xs font-semibold text-campus-700 bg-campus-50 hover:bg-campus-100 px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
                            >
                              Manage
                            </button>
                            <button
                              onClick={() => setConfirm({ kind: 'delete', userId: user.id, userName: user.name })}
                              disabled={isBusy || isSelf}
                              aria-label={`Delete ${user.name}`}
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                        No users found.
                      </td>
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

      {/* Manage user modal */}
      {manageUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-campus-900">Manage user</h3>
                <p className="text-xs text-gray-500 mt-0.5">{manageUser.name} · {manageUser.email}</p>
              </div>
              <button
                onClick={closeManage}
                aria-label="Close"
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-campus-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Role</label>
                <select
                  value={manageRole}
                  onChange={(e) => setManageRole(e.target.value)}
                  disabled={manageUser.id === currentUser?.id}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400 disabled:opacity-60"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {manageUser.id === currentUser?.id && (
                  <p className="text-xs text-gray-400 mt-1">You cannot change your own role.</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  {identifierLabelFor(manageRole)}
                </label>
                <input
                  value={manageIdentifier}
                  onChange={(e) => setManageIdentifier(e.target.value)}
                  placeholder={identifierPlaceholderFor(manageRole)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                />
                <p className="text-xs text-gray-400 mt-1">Must be unique across the organisation.</p>
              </div>

              {manageError && (
                <div className="p-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100">
                  {manageError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={closeManage}
                disabled={manageSaving}
                className="px-4 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-white transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={saveManage}
                disabled={manageSaving}
                className="px-4 h-10 rounded-lg text-sm font-semibold text-white bg-campus-800 hover:bg-campus-700 disabled:opacity-60 transition-colors"
              >
                {manageSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold text-campus-900">
              {confirm.kind === 'bulk-delete' ? 'Delete selected users?' : 'Delete user?'}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {confirm.kind === 'bulk-delete'
                ? `This will permanently delete ${confirm.ids.length} user${confirm.ids.length !== 1 ? 's' : ''} and their related data. This action cannot be undone.`
                : `This will permanently delete ${confirm.userName} and their related data. This action cannot be undone.`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirm(null)}
                disabled={bulkDeleting || updatingId !== null}
                className="px-4 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirm.kind === 'delete') handleDelete(confirm.userId);
                  else if (confirm.kind === 'bulk-delete') handleBulkDelete(confirm.ids);
                }}
                disabled={bulkDeleting || updatingId !== null}
                className="px-4 h-10 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {bulkDeleting || updatingId !== null ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
