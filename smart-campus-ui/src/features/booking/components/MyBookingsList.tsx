import { useEffect, useState } from 'react';
import type { BookingDTO, BookingStatus } from '@/services/bookingService';
import { bookingService } from '@/services/bookingService';

const statusStyle: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  REJECTED: 'bg-red-50 text-red-700 border border-red-100',
  CANCELLED: 'bg-gray-100 text-gray-600 border border-gray-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border border-blue-100',
};

const STATUS_FILTERS: (BookingStatus | 'ALL')[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];

interface MyBookingsListProps {
  onEdit?: (booking: BookingDTO) => void;
}

export function MyBookingsList({ onEdit }: MyBookingsListProps = {}) {
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [cancelConfirm, setCancelConfirm] = useState<BookingDTO | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings(
        selectedStatus === 'ALL' ? undefined : selectedStatus,
      );
      setBookings(response.data.content);
      setError(null);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelConfirm) return;
    try {
      setCancelling(true);
      setError(null);
      await bookingService.cancel(cancelConfirm.id);
      setSuccess(`Booking for "${cancelConfirm.resourceName}" has been cancelled.`);
      setCancelConfirm(null);
      loadBookings();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to cancel booking');
      setCancelConfirm(null);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-campus-900">My Bookings</h2>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
          </svg>
          {success}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSelectedStatus(s)}
            className={`h-9 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              selectedStatus === s
                ? 'bg-campus-800 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {cancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-campus-900">
                  {cancelConfirm.status === 'PENDING' ? 'Withdraw Request' : 'Cancel Booking'}
                </h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel your booking for <strong>{cancelConfirm.resourceName}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="flex-1 h-11 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button
                onClick={() => setCancelConfirm(null)}
                disabled={cancelling}
                className="flex-1 h-11 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Keep It
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-900">No bookings found</p>
          <p className="text-xs text-gray-500 mt-1">Submit a booking request to see it here.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-campus-800 truncate">{booking.resourceName}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{booking.purpose}</p>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md shrink-0 ${statusStyle[booking.status]}`}>
                  {booking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Start</p>
                  <p>{new Date(booking.startTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">End</p>
                  <p>{new Date(booking.endTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Location</p>
                  <p className="truncate">{booking.locationName || '—'}</p>
                </div>
                {booking.expectedAttendees != null && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Attendees</p>
                    <p>{booking.expectedAttendees}</p>
                  </div>
                )}
              </div>

              {booking.rejectionReason && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">Rejection Reason</p>
                  <p className="text-sm text-red-700">{booking.rejectionReason}</p>
                </div>
              )}

              {(booking.canEdit || booking.canCancel) && (
                <div className="mt-4 flex justify-end gap-2 flex-wrap">
                  {booking.canEdit && onEdit && (
                    <button
                      onClick={() => onEdit(booking)}
                      className="h-9 px-4 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  {booking.canCancel && (
                    <button
                      onClick={() => setCancelConfirm(booking)}
                      className="h-9 px-4 border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
                    >
                      {booking.status === 'PENDING' ? 'Withdraw' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
