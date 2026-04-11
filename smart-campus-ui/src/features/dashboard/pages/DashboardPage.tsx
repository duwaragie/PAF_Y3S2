import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import StudentDashboard from '../components/StudentDashboard';
import LecturerDashboard from '../components/LecturerDashboard';
import AdminDashboard from '../components/AdminDashboard';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <AppLayout>
      {user?.role === 'ADMIN' && <AdminDashboard />}
      {user?.role === 'LECTURER' && <LecturerDashboard />}
      {(user?.role === 'STUDENT' || !user?.role) && <StudentDashboard />}
    </AppLayout>
  );
}
