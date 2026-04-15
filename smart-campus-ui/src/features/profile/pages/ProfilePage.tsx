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

const roleBadge: Record<string, string> = {
  STUDENT: 'bg-campus-600 text-white',
  LECTURER: 'bg-purple-600 text-white',
  ADMIN: 'bg-red-600 text-white',
};

const inputCls =
  'w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400';
const btnCls =
  'h-10 px-5 bg-campus-800 text-white text-sm font-semibold rounded-lg hover:bg-campus-700 disabled:opacity-60 transition-colors';

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
  const isStudent = user?.role === 'STUDENT';
  const identifier = isStudent ? user?.studentRegistrationNumber : user?.employeeId;
  const identifierLabel = isStudent ? 'Registration No.' : 'Employee ID';

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-5 items-start">
        {/* Left column: identity + account info */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex flex-col items-center text-center gap-2.5">
              <div className="w-16 h-16 rounded-full bg-campus-600 text-white flex items-center justify-center text-xl font-bold ring-4 ring-campus-100">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="text-lg font-bold text-campus-900">{user?.name}</h1>
                <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
              </div>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md ${roleBadge[user?.role || 'STUDENT']}`}>
                {user?.role}
              </span>
              {user?.createdAt && (
                <span className="text-[11px] text-gray-400">
                  Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-[11px] font-bold text-campus-900 mb-3 uppercase tracking-wider">
              Account Information
            </h2>
            <dl className="space-y-2">
              {[
                { label: 'Auth Provider', value: user?.authProvider?.toLowerCase() },
                { label: 'Email Verified', value: user?.emailVerified ? 'Yes' : 'No' },
                { label: 'Role', value: user?.role },
                { label: identifierLabel, value: identifier || null, missing: !identifier },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 py-1 border-b border-gray-50 last:border-0"
                >
                  <dt className="text-xs text-gray-500">{item.label}</dt>
                  <dd
                    className={`text-sm font-semibold capitalize ${
                      item.missing ? 'text-red-600' : 'text-campus-800'
                    }`}
                  >
                    {item.missing ? 'Not set' : item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Right column: stacked forms, compact */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-base font-bold text-campus-900 mb-3">Edit Profile</h2>
            {profileMsg && (
              <div
                className={`p-2.5 rounded-lg text-sm font-medium mb-3 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {profileMsg.text}
              </div>
            )}
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Full Name</label>
                  <input {...profileForm.register('name')} className={inputCls} />
                  {profileForm.formState.errors.name && (
                    <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Picture URL</label>
                  <input
                    {...profileForm.register('picture')}
                    placeholder="https://..."
                    className={inputCls}
                  />
                </div>
              </div>
              <button type="submit" disabled={profileLoading} className={btnCls}>
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-base font-bold text-campus-900 mb-3">Change Password</h2>
            {!canChangePassword ? (
              <p className="text-sm text-gray-500">
                Your account is managed through Google Sign-In. Password changes aren't available here.
              </p>
            ) : (
              <>
                {passwordMsg && (
                  <div
                    className={`p-2.5 rounded-lg text-sm font-medium mb-3 ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {passwordMsg.text}
                  </div>
                )}
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Current Password</label>
                    <input
                      type="password"
                      {...passwordForm.register('currentPassword')}
                      className={inputCls}
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-xs text-red-500 mt-1">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">New Password</label>
                      <input
                        type="password"
                        {...passwordForm.register('newPassword')}
                        className={inputCls}
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-xs text-red-500 mt-1">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Confirm New Password</label>
                      <input
                        type="password"
                        {...passwordForm.register('confirmPassword')}
                        className={inputCls}
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <button type="submit" disabled={passwordLoading} className={btnCls}>
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
