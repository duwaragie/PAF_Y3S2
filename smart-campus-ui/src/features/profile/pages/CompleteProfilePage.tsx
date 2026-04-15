import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/services/userService';
import { Logo } from '@/components/Logo';

const studentSchema = z.object({
  studentRegistrationNumber: z
    .string()
    .min(3, 'Registration number is required')
    .max(32, 'Registration number is too long'),
});

type StudentForm = z.infer<typeof studentSchema>;

export default function CompleteProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<StudentForm>({ resolver: zodResolver(studentSchema) });

  if (!user) return null;

  const isStudent = user.role === 'STUDENT';

  const onSubmit = async (data: StudentForm) => {
    try {
      setLoading(true);
      setError(null);
      const res = await userService.updateProfile({
        name: user.name,
        studentRegistrationNumber: data.studentRegistrationNumber.trim(),
      });
      updateUser(res.data);
      navigate('/', { replace: true });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Could not save registration number. It may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-8 space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-campus-900">Complete your profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            A few more details are required before you can access the platform.
          </p>
        </div>

        {isStudent ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Student Registration Number
              </label>
              <input
                {...form.register('studentRegistrationNumber')}
                placeholder="e.g. IT22123456"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
              />
              {form.formState.errors.studentRegistrationNumber && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.studentRegistrationNumber.message}
                </p>
              )}
            </div>
            {error && (
              <div className="p-3 rounded-xl text-sm font-medium bg-red-50 text-red-600">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full h-11 bg-transparent text-gray-500 text-sm font-medium rounded-xl hover:text-campus-900 hover:bg-gray-50 transition-colors"
            >
              Sign out
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-sm">
              Your employee ID has not been assigned yet. Please contact an administrator to
              activate your account.
            </div>
            <button
              onClick={logout}
              className="w-full h-11 bg-gray-100 text-campus-900 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
