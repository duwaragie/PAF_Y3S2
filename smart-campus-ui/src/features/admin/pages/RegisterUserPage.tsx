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
      const res = await adminService.createUser(data);
      setMsg({ type: 'success', text: `Account for ${res.data.name} (${res.data.role}) created successfully.` });
      reset();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({ type: 'error', text: e.response?.data?.message || 'Failed to create account.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-campus-900">Register New Staff Account</h1>
          <p className="text-sm text-gray-500 mt-1">Create accounts for lecturers or administrators. Accounts are pre-verified and ready to use.</p>
        </div>

        {msg && (
          <div className={`p-3.5 rounded-xl text-sm font-medium flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {msg.type === 'success'
                ? <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                : <><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></>}
            </svg>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
            <input
              {...register('name')}
              placeholder="John Doe"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

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
            <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Minimum 8 characters"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 disabled:opacity-60 transition-colors"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
