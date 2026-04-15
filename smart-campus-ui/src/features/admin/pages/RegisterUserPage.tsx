import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AppLayout from '@/components/layout/AppLayout';
import { adminService } from '@/services/adminService';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['LECTURER', 'ADMIN'], { message: 'Please select a role' }),
  employeeId: z.string().min(1, 'Employee ID is required').max(32, 'Employee ID is too long'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'LECTURER' },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      setMsg(null);
      const res = await adminService.createUser({ ...data, employeeId: data.employeeId.trim() });
      setMsg({
        type: 'success',
        text: `Account for ${res.data.name} (${res.data.role}) created successfully.`,
      });
      reset({ role: 'LECTURER' });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({ type: 'error', text: e.response?.data?.message || 'Failed to create account.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Full-width heading */}
        <div className="space-y-3">
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-campus-500 bg-campus-50 px-2.5 py-1 rounded-md">
            Admin only
          </span>
          <h1 className="text-2xl font-bold text-campus-900 leading-tight">
            Register New Staff Account
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Create accounts for lecturers or administrators. Accounts are pre-verified and ready
            to use immediately, so no email verification step is required.
          </p>
        </div>

        {/* 2-column: help cards on left, form on right, aligned */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6 lg:gap-8 items-start">
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                What happens next
              </h3>
              <ol className="space-y-3">
                {[
                  'The account is created with email verified and ready to sign in.',
                  'The employee ID you assign is permanent and must be unique.',
                  'Share the temporary password securely, and have the user change it on first login.',
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-campus-50 text-campus-600 text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {text}
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-campus-50/60 rounded-2xl border border-campus-100 p-5 space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-campus-600">
                Role permissions
              </h3>
              <dl className="text-sm space-y-1.5">
                <div className="flex justify-between gap-2">
                  <dt className="font-semibold text-campus-800">Lecturer</dt>
                  <dd className="text-gray-500 text-right">Manage bookings &amp; incidents</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-semibold text-campus-800">Administrator</dt>
                  <dd className="text-gray-500 text-right">Full platform access</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="space-y-4">
            {msg && (
              <div
                className={`p-3.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
                  msg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-red-50 text-red-600 border border-red-100'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {msg.type === 'success' ? (
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4m0 4h.01" />
                    </>
                  )}
                </svg>
                {msg.text}
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5"
            >
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
                <input
                  {...register('name')}
                  placeholder="John Doe"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="name@academiccurator.edu"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Employee ID</label>
                  <input
                    {...register('employeeId')}
                    placeholder="EMP-0001"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                  />
                  {errors.employeeId && (
                    <p className="text-xs text-red-500 mt-1">{errors.employeeId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="Minimum 8 characters"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Role</label>
                  <select
                    {...register('role')}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                  >
                    <option value="LECTURER">Lecturer</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                  {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 disabled:opacity-60 transition-colors"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
