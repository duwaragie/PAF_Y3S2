import { CreateBookingForm } from '../components/CreateBookingForm';
import { ResourceBookingTimeline } from '../components/ResourceBookingTimeline';
import { MyBookingsList } from '../components/MyBookingsList';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import type { BookingDTO } from '@/services/bookingService';

export function BookingPage() {
  const [refreshList, setRefreshList] = useState(0);
  const [editingBooking, setEditingBooking] = useState<BookingDTO | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<number | undefined>(undefined);
  const [searchParams] = useSearchParams();
  const preselectedResourceId = Number(searchParams.get('resourceId')) || undefined;

  const handleSuccess = () => {
    setEditingBooking(null);
    setRefreshList((n) => n + 1);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-campus-900">Resource Booking</h1>
          <p className="text-sm text-gray-500 mt-1">Request and manage your resource bookings</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <CreateBookingForm
            key={editingBooking?.id ?? `new-${preselectedResourceId ?? ''}`}
            editingBooking={editingBooking ?? undefined}
            resourceId={preselectedResourceId}
            onSuccess={handleSuccess}
            onCancel={() => setEditingBooking(null)}
            onResourceChange={setSelectedResourceId}
          />
          <ResourceBookingTimeline resourceId={selectedResourceId ?? preselectedResourceId} />
          <MyBookingsList
            key={refreshList}
            onEdit={(booking) => {
              setEditingBooking(booking);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
