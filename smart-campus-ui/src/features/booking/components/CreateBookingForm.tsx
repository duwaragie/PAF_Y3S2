import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookingService, type BookingDTO } from '@/services/bookingService';
import { resourceService, type ResourceDTO } from '@/services/resourceService';

const bookingSchema = z.object({
  resourceId: z.number().min(1, 'Resource is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  purpose: z.string().min(5, 'Purpose must be at least 5 characters').max(500),
  expectedAttendees: z.number().min(1, 'Must have at least 1 attendee').optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface CreateBookingFormProps {
  resourceId?: number;
  resourceName?: string;
  editingBooking?: BookingDTO;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Convert ISO/UTC timestamp → "yyyy-MM-ddTHH:mm" for <input type="datetime-local">.
 */
function toDatetimeLocal(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateBookingForm({ resourceId, resourceName, editingBooking, onSuccess, onCancel }: CreateBookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<ResourceDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!editingBooking;

  useEffect(() => {
    if (resourceId && !isEditMode) return;
    resourceService.search({ status: 'ACTIVE' })
      .then((res) => setResources(res.data))
      .catch(() => setResources([]));
  }, [resourceId, isEditMode]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: editingBooking
      ? {
          resourceId: editingBooking.resourceId,
          startTime: toDatetimeLocal(editingBooking.startTime),
          endTime: toDatetimeLocal(editingBooking.endTime),
          purpose: editingBooking.purpose,
          expectedAttendees: editingBooking.expectedAttendees ?? undefined,
        }
      : {
          resourceId: resourceId || undefined,
        },
  });

  const selectedResourceId = watch('resourceId');
  const selectedResource = useMemo(
    () => resources.find((r) => r.id === Number(selectedResourceId)),
    [resources, selectedResourceId],
  );
  const capacityHint = selectedResource?.capacity ?? null;

  // When editing, re-apply the saved resourceId once the async dropdown options land.
  useEffect(() => {
    if (!editingBooking) return;
    if (resources.some((r) => r.id === editingBooking.resourceId)) {
      setValue('resourceId', editingBooking.resourceId);
    }
  }, [resources, editingBooking, setValue]);

  const onSubmit = async (data: BookingFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (isEditMode && editingBooking) {
        await bookingService.update(editingBooking.id, data);
        setSuccess('Booking updated. Awaiting admin approval.');
      } else {
        await bookingService.create(data);
        setSuccess('Booking request submitted successfully. Awaiting admin approval.');
        reset();
      }
      onSuccess?.();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || (isEditMode ? 'Failed to update booking' : 'Failed to create booking'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm w-full">
      <h2 className="text-lg font-bold text-campus-900 mb-5">
        {isEditMode ? 'Edit Booking' : 'Request a Booking'}
      </h2>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
          </svg>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!resourceId && (
          <div>
            <label htmlFor="resourceId" className="text-sm font-medium text-gray-700 mb-1 block">
              Resource <span className="text-red-400">*</span>
            </label>
            <select
              id="resourceId"
              {...register('resourceId', { valueAsNumber: true })}
              className={`w-full h-11 px-4 rounded-xl border text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${errors.resourceId ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
            >
              <option value="">Select a facility</option>
              {editingBooking && !resources.some((r) => r.id === editingBooking.resourceId) && (
                <option value={editingBooking.resourceId}>
                  {editingBooking.resourceName} (currently unavailable)
                </option>
              )}
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.location}{r.capacity ? ` (${r.capacity} pax)` : ''}
                </option>
              ))}
            </select>
            {errors.resourceId && <p className="text-xs text-red-500 mt-1 font-medium">{errors.resourceId.message}</p>}
          </div>
        )}

        {resourceName && <p className="text-sm text-gray-600">Resource: {resourceName}</p>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="text-sm font-medium text-gray-700 mb-1 block">
              Start Time <span className="text-red-400">*</span>
            </label>
            <input
              id="startTime"
              type="datetime-local"
              {...register('startTime')}
              className={`w-full h-11 px-4 rounded-xl border text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${errors.startTime ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
            />
            {errors.startTime && <p className="text-xs text-red-500 mt-1 font-medium">{errors.startTime.message}</p>}
          </div>

          <div>
            <label htmlFor="endTime" className="text-sm font-medium text-gray-700 mb-1 block">
              End Time <span className="text-red-400">*</span>
            </label>
            <input
              id="endTime"
              type="datetime-local"
              {...register('endTime')}
              className={`w-full h-11 px-4 rounded-xl border text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${errors.endTime ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
            />
            {errors.endTime && <p className="text-xs text-red-500 mt-1 font-medium">{errors.endTime.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="purpose" className="text-sm font-medium text-gray-700 mb-1 block">
            Purpose <span className="text-red-400">*</span>
          </label>
          <input
            id="purpose"
            placeholder="Describe the purpose of the booking"
            {...register('purpose')}
            className={`w-full h-11 px-4 rounded-xl border text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${errors.purpose ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
          />
          {errors.purpose && <p className="text-xs text-red-500 mt-1 font-medium">{errors.purpose.message}</p>}
        </div>

        <div>
          <label htmlFor="expectedAttendees" className="text-sm font-medium text-gray-700 mb-1 block">
            Expected Attendees
            {capacityHint != null && <span className="ml-2 text-xs font-normal text-gray-400">(max {capacityHint} for this facility)</span>}
          </label>
          <input
            id="expectedAttendees"
            type="number"
            min={1}
            max={capacityHint ?? undefined}
            placeholder="Number of attendees"
            {...register('expectedAttendees', { valueAsNumber: true })}
            className={`w-full h-11 px-4 rounded-xl border text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${errors.expectedAttendees ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
          />
          {errors.expectedAttendees && (
            <p className="text-xs text-red-500 mt-1 font-medium">{errors.expectedAttendees.message}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 h-11 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 disabled:opacity-60 transition-colors"
          >
            {loading ? (isEditMode ? 'Saving...' : 'Submitting...') : (isEditMode ? 'Save Changes' : 'Submit Booking Request')}
          </button>
          {isEditMode && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="h-11 px-6 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
