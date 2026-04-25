import { useEffect, useState } from 'react';
import { BookingGanttChart } from './BookingGanttChart';
import { bookingService, type BookingDTO } from '@/services/bookingService';

type ResourceBookingTimelineProps = {
  resourceId?: number;
};

export function ResourceBookingTimeline({ resourceId }: ResourceBookingTimelineProps) {
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resourceId) {
      setBookings([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    bookingService.getResourceBookings(resourceId)
      .then((response) => {
        if (cancelled) return;
        setBookings(response.data);
      })
      .catch((err) => {
        if (cancelled) return;
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || 'Failed to load resource timeline');
        setBookings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-campus-900">Resource Timeline</h2>
          <p className="text-sm text-gray-500 mt-1">
            {resourceId
              ? 'Anonymous booking status for the selected resource.'
              : 'Select a resource above to view its booking timeline.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <div className="mx-auto w-8 h-8 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
        </div>
      ) : resourceId ? (
        <BookingGanttChart bookings={bookings} scope="user" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Choose a resource first</p>
          <p className="text-xs text-gray-500 mt-1">The timeline will appear here once you select a facility.</p>
        </div>
      )}
    </div>
  );
}