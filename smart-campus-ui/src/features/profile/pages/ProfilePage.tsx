import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/services/userService';
import { storageService } from '@/services/storageService';
import NotificationPreferencesCard from '../components/NotificationPreferencesCard';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const isSupabaseUrl = (url: string | null | undefined) =>
  !!url && url.includes('/storage/v1/object/public/uploads/');

const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    userService.getProfile().then((res) => {
      updateUser(res.data);
      profileForm.reset({ name: res.data.name });
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

  const onPickAvatar = () => {
    setAvatarMsg(null);
    fileInputRef.current?.click();
  };

  const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarMsg({ type: 'error', text: 'Please use a JPG, PNG, WebP, or GIF image.' });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarMsg({ type: 'error', text: 'Please keep the file under 3 MB.' });
      return;
    }

    try {
      setAvatarBusy(true);
      setAvatarMsg(null);
      const previousUrl = user?.picture;
      const uploadedUrl = await storageService.upload(file, 'avatars');
      const res = await userService.setPicture(uploadedUrl);
      updateUser(res.data);
      if (isSupabaseUrl(previousUrl) && previousUrl !== uploadedUrl) {
        storageService.remove(previousUrl!).catch(() => { /* ignore cleanup failures */ });
      }
      setAvatarMsg({ type: 'success', text: 'Profile photo updated.' });
    } catch (err) {
      const e = err as { message?: string };
      setAvatarMsg({ type: 'error', text: e.message || 'Upload failed. Please try again.' });
    } finally {
      setAvatarBusy(false);
    }
  };

  const onRemoveAvatar = async () => {
    try {
      setAvatarBusy(true);
      setAvatarMsg(null);
      const previousUrl = user?.picture;
      const res = await userService.clearPicture();
      updateUser(res.data);
      if (isSupabaseUrl(previousUrl)) {
        storageService.remove(previousUrl!).catch(() => { /* ignore cleanup failures */ });
      }
      setAvatarMsg({ type: 'success', text: 'Profile photo removed.' });
    } catch {
      setAvatarMsg({ type: 'error', text: 'Could not remove photo. Please try again.' });
    } finally {
      setAvatarBusy(false);
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
      <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-5 items-start">
        {/* Left column: identity + account info */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_AVATAR_TYPES.join(',')}
              className="hidden"
              onChange={onAvatarSelected}
            />
            <div className="flex flex-col items-center text-center gap-2.5">
              <div className="relative">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || 'Profile'}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-campus-100"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-campus-600 text-white flex items-center justify-center text-2xl font-bold ring-4 ring-campus-100">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                {avatarBusy && (
                  <div className="absolute inset-0 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-campus-600 rounded-full animate-spin" />
                  </div>
                )}
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

              <div className="flex items-center gap-2 pt-3 w-full">
                <button
                  onClick={onPickAvatar}
                  disabled={avatarBusy}
                  className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-campus-800 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
                  </svg>
                  {user?.picture ? 'Change photo' : 'Upload photo'}
                </button>
                {user?.picture && (
                  <button
                    onClick={onRemoveAvatar}
                    disabled={avatarBusy}
                    className="h-9 px-3 inline-flex items-center justify-center rounded-lg border border-gray-200 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-100 disabled:opacity-60 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              {avatarMsg && (
                <p
                  className={`text-[11px] font-medium ${
                    avatarMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {avatarMsg.text}
                </p>
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
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Full Name</label>
                <input {...profileForm.register('name')} className={inputCls} />
                {profileForm.formState.errors.name && (
                  <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.name.message}</p>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                Manage your profile photo from the card on the left.
              </p>
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

      <NotificationPreferencesCard />
      </div>
    </AppLayout>
  );
}
