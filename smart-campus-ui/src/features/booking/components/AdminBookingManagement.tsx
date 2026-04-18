import { useEffect, useState } from 'react';
import type { BookingDTO } from '@/services/bookingService';
import { bookingService } from '@/services/bookingService';

type ConfirmAction = { type: 'approve'; booking: BookingDTO } | { type: 'reject'; booking: BookingDTO; reason: string };

export function AdminBookingManagement() {
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getPendingBookings();
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

  const askApprove = (booking: BookingDTO) => {
    setError(null);
    setSuccess(null);
    setConfirm({ type: 'approve', booking });
  };

  const askReject = (booking: BookingDTO) => {
    const reason = rejectionReasons[booking.id]?.trim();
    if (!reason || reason.length < 5) {
      setError('Please provide a rejection reason (at least 5 characters).');
      setSuccess(null);
      return;
    }
    setError(null);
    setSuccess(null);
    setConfirm({ type: 'reject', booking, reason });
  };

  const doAction = async () => {
    if (!confirm) return;
    try {
      setActing(true);
      setError(null);
      if (confirm.type === 'approve') {
        await bookingService.approve(confirm.booking.id);
        setSuccess(`Approved booking for "${confirm.booking.resourceName}". Any overlapping pending requests were auto-rejected.`);
      } else {
        await bookingService.reject(confirm.booking.id, confirm.reason);
        setSuccess(`Rejected booking for "${confirm.booking.resourceName}".`);
        setRejectionReasons((prev) => {
          const next = { ...prev };
          delete next[confirm.booking.id];
          return next;
        });
        setExpandedBooking(null);
      }
      setConfirm(null);
      loadBookings();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Action failed');
      setConfirm(null);
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div>
        <h2 className="text-lg font-bold text-campus-900">Pending Booking Requests</h2>
        <p className="text-sm text-gray-500 mt-1">Total pending: {bookings.length}</p>
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

      {confirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${confirm.type === 'approve' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <svg className={`w-5 h-5 ${confirm.type === 'approve' ? 'text-emerald-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {confirm.type === 'approve' ? (
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                  ) : (
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />
                  )}
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-campus-900">
                  {confirm.type === 'approve' ? 'Approve Booking' : 'Reject Booking'}
                </h3>
                <p className="text-sm text-gray-500">
                  {confirm.type === 'approve'
                    ? 'The slot will be locked after approval.'
                    : 'The requester will be notified with your reason.'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {confirm.type === 'approve' ? (
                <>
                  Approve <strong>{confirm.booking.userName}</strong>'s request for{' '}
                  <strong>{confirm.booking.resourceName}</strong>? Other pending requests overlapping this slot will be
                  auto-rejected.
                </>
              ) : (
                <>
                  Reject <strong>{confirm.booking.userName}</strong>'s request for{' '}
                  <strong>{confirm.booking.resourceName}</strong> with the reason above?
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={doAction}
                disabled={acting}
                className={`flex-1 h-11 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors ${
                  confirm.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {acting ? 'Working...' : confirm.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
              </button>
              <button
                onClick={() => setConfirm(null)}
                disabled={acting}
                className="flex-1 h-11 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Back
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
          <p className="text-sm font-semibold text-gray-900">No pending bookings</p>
          <p className="text-xs text-gray-500 mt-1">New requests will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div>
                  <p className="font-semibold text-campus-800">{booking.resourceName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Requested by <span className="font-medium">{booking.userName}</span> ({booking.userEmail})
                  </p>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
                  PENDING
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Requested At</p>
                  <p>{new Date(booking.requestedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Booking Slot</p>
                  <p>
                    {new Date(booking.startTime).toLocaleDateString()} ·{' '}
                    {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                    {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Purpose</p>
                <p className="text-sm text-gray-700">{booking.purpose}</p>
              </div>

              {booking.expectedAttendees != null && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Attendees</p>
                  <p className="text-sm text-gray-700">{booking.expectedAttendees}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                <button
                  onClick={() => askApprove(booking)}
                  className="h-10 px-5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    setExpandedBooking(expandedBooking === booking.id ? null : booking.id)
                  }
                  className="h-10 px-5 border border-gray-200 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {expandedBooking === booking.id ? 'Hide' : 'Reject'}
                </button>
              </div>

              {expandedBooking === booking.id && (
                <div className="mt-4 p-4 bg-gray-50/70 rounded-xl border border-gray-100 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor={`reason-${booking.id}`}>
                      Rejection Reason <span className="text-red-400">*</span>
                    </label>
                    <input
                      id={`reason-${booking.id}`}
                      placeholder="Explain why this request is being rejected"
                      value={rejectionReasons[booking.id] || ''}
                      onChange={(e) =>
                        setRejectionReasons((prev) => ({ ...prev, [booking.id]: e.target.value }))
                      }
                      minLength={5}
                      maxLength={500}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200"
                    />
                  </div>
                  <button
                    onClick={() => askReject(booking)}
                    className="w-full h-11 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Confirm Rejection
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
