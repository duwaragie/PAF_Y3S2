import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/services/userService';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  picture: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', picture: user?.picture || '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    userService.getProfile().then((res) => {
      updateUser(res.data);
      profileForm.reset({ name: res.data.name, picture: res.data.picture || '' });
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      setProfileLoading(true);
      setProfileMsg(null);
      const res = await userService.updateProfile(data);
      updateUser(res.data);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch {
      setProfileMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      setPasswordLoading(true);
      setPasswordMsg(null);
      await userService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      passwordForm.reset();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setPasswordMsg({ type: 'error', text: e.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const canChangePassword = user?.authProvider === 'LOCAL' || user?.authProvider === 'BOTH';

  const roleBadge: Record<string, string> = {
    STUDENT: 'bg-campus-600 text-white',
    LECTURER: 'bg-purple-600 text-white',
    ADMIN: 'bg-red-600 text-white',
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-campus-600 text-white flex items-center justify-center text-2xl font-bold ring-4 ring-campus-100">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-campus-900">{user?.name}</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${roleBadge[user?.role || 'STUDENT']}`}>
                  {user?.role}
                </span>
                {user?.createdAt && (
                  <span className="text-xs text-gray-400">
                    Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-campus-900 mb-4">Edit Profile</h2>
          {profileMsg && (
            <div className={`p-3 rounded-xl text-sm font-medium mb-4 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {profileMsg.text}
            </div>
          )}
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
              <input
                {...profileForm.register('name')}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
              />
              {profileForm.formState.errors.name && (
                <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Picture URL</label>
              <input
                {...profileForm.register('picture')}
                placeholder="https://..."
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
              />
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="h-11 px-6 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 disabled:opacity-60 transition-colors"
            >
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        {canChangePassword && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-campus-900 mb-4">Change Password</h2>
            {passwordMsg && (
              <div className={`p-3 rounded-xl text-sm font-medium mb-4 ${passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {passwordMsg.text}
              </div>
            )}
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Current Password</label>
                <input
                  type="password"
                  {...passwordForm.register('currentPassword')}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">New Password</label>
                <input
                  type="password"
                  {...passwordForm.register('newPassword')}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Confirm New Password</label>
                <input
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                className="h-11 px-6 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 disabled:opacity-60 transition-colors"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Account Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-campus-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Auth Provider', value: user?.authProvider?.toLowerCase() },
              { label: 'Email Verified', value: user?.emailVerified ? 'Yes' : 'No' },
              { label: 'Role', value: user?.role },
              { label: 'User ID', value: `#${user?.id}` },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-gray-50/80">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-semibold text-campus-800 mt-0.5 capitalize">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
