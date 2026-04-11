import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { api } from '@/lib/axios';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!token || !email) {
    return (
      <AuthLayout
        title="" description=""
        heading="Securing your academic journey."
        subheading="Our multi-factor authentication ensures that your research, records, and institutional data remain protected under the highest security standards."
      >
        <div className="space-y-6">
          <h2 className="text-[1.75rem] font-bold tracking-tight text-campus-900">Invalid link</h2>
          <p className="text-[15px] text-gray-500">This reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-sm font-semibold text-campus-800 hover:text-campus-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      await api.post('/auth/reset-password', { email, token, newPassword: data.newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      setError(errorResponse.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const EyeToggle = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
    >
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {showPassword ? (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        ) : (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  );

  return (
    <AuthLayout
      title="" description=""
      heading="Securing your academic journey."
      subheading="Our multi-factor authentication ensures that your research, records, and institutional data remain protected under the highest security standards."
    >
      <div className="space-y-6">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-campus-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-[1.75rem] font-bold tracking-tight text-campus-900">Set new password</h2>
          <p className="text-[15px] text-gray-500">
            Create a new password for <span className="font-semibold text-campus-700">{email}</span>
          </p>
        </div>

        {success ? (
          <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 p-3.5 rounded-xl text-sm border border-emerald-100">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Password reset successfully. Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 text-red-600 p-3.5 rounded-xl text-sm border border-red-100">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-[11px] font-bold text-campus-600 tracking-[0.1em] uppercase">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={`w-full h-[48px] px-4 pr-12 rounded-xl border bg-white text-[15px] text-campus-900 placeholder:text-gray-400 outline-none transition-all focus:border-campus-600 focus:ring-2 focus:ring-campus-600/10 ${errors.newPassword ? 'border-red-400' : 'border-gray-200'}`}
                  {...register('newPassword')}
                />
                <EyeToggle />
              </div>
              {errors.newPassword && <p className="text-red-500 text-xs">{errors.newPassword.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-[11px] font-bold text-campus-600 tracking-[0.1em] uppercase">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={`w-full h-[48px] px-4 pr-12 rounded-xl border bg-white text-[15px] text-campus-900 placeholder:text-gray-400 outline-none transition-all focus:border-campus-600 focus:ring-2 focus:ring-campus-600/10 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-200'}`}
                  {...register('confirmPassword')}
                />
                <EyeToggle />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] bg-campus-800 hover:bg-campus-700 text-white text-[15px] font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Resetting...
                </span>
              ) : (
                'Reset password'
              )}
            </button>
          </form>
        )}

        <Link to="/login" className="flex items-center gap-1.5 text-sm font-semibold text-campus-800 hover:text-campus-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
