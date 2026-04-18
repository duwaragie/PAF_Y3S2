import { AdminBookingManagement } from '../components/AdminBookingManagement';
import AppLayout from '@/components/layout/AppLayout';

export function AdminBookingPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-campus-900">Booking Management</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage booking requests</p>
        </div>

        <AdminBookingManagement />
      </div>
    </AppLayout>
  );
}
