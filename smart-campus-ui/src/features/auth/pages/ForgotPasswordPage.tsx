import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { api } from '@/lib/axios';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
    } catch (err) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      setError(errorResponse.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title=""
      description=""
      heading="Securing your academic journey."
      subheading="Our multi-factor authentication ensures that your research, records, and institutional data remain protected under the highest security standards."
    >
      <div className="space-y-6">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-campus-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {!sent ? (
          <>
            <div className="space-y-2">
              <h2 className="text-[1.75rem] font-bold tracking-tight text-campus-900">Forgot password?</h2>
              <p className="text-[15px] text-gray-500">
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>

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
                <label htmlFor="email" className="block text-sm font-semibold text-campus-800">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 4L12 13L2 4" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@university.edu"
                    autoComplete="email"
                    className={`w-full h-[48px] pl-11 pr-4 rounded-xl border bg-white text-[15px] text-campus-900 placeholder:text-gray-400 outline-none transition-all focus:border-campus-600 focus:ring-2 focus:ring-campus-600/10 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
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
                    Sending...
                  </span>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h2 className="text-[1.75rem] font-bold tracking-tight text-campus-900">Check your email</h2>
              <p className="text-[15px] text-gray-500">
                If an account exists with that email, we've sent a password reset link. Please check your inbox and spam folder.
              </p>
            </div>

            <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 p-3.5 rounded-xl text-sm border border-emerald-100">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Reset link sent successfully.
            </div>
          </>
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
