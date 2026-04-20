import { api } from '@/lib/axios';

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface BookingDTO {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  resourceId: number;
  resourceName: string;
  locationName?: string;
  startTime: string;
  endTime: string;
  purpose: string;
  expectedAttendees?: number;
  status: BookingStatus;
  rejectionReason?: string;
  adminCancelReason?: string;
  approvedById?: number;
  approvedByName?: string;
  cancelledById?: number;
  cancelledByName?: string;
  requestedAt: string;
  updatedAt: string;
  approvedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  canEdit?: boolean;
  canCancel?: boolean;
  canReview?: boolean;
}

export interface CreateBookingRequest {
  resourceId: number;
  startTime: string;
  endTime: string;
  purpose: string;
  expectedAttendees?: number;
}

export interface RejectBookingRequest {
  bookingId: number;
  rejectionReason: string;
}

export interface AdminCancelBookingRequest {
  reason: string;
}

export interface ConflictProbeResponse {
  hasConflict: boolean;
  count: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const bookingService = {
  create: (data: CreateBookingRequest) =>
    api.post<BookingDTO>('/bookings', data),

  update: (id: number, data: CreateBookingRequest) =>
    api.put<BookingDTO>(`/bookings/${id}`, data),

  getById: (id: number) =>
    api.get<BookingDTO>(`/bookings/${id}`),

  getMyBookings: (status?: BookingStatus, page = 0, size = 10) =>
    api.get<PaginatedResponse<BookingDTO>>('/bookings/my-bookings', {
      params: { ...(status && { status }), page, size },
    }),

  getResourceBookings: (resourceId: number) =>
    api.get<BookingDTO[]>(`/bookings/resource/${resourceId}`),

  getUpcomingBookings: (resourceId: number) =>
    api.get<BookingDTO[]>(`/bookings/resource/${resourceId}/upcoming`),

  getAllBookings: (
    userId?: number,
    resourceId?: number,
    status?: BookingStatus,
    page = 0,
    size = 10
  ) =>
    api.get<PaginatedResponse<BookingDTO>>('/bookings/admin/all', {
      params: {
        ...(userId && { userId }),
        ...(resourceId && { resourceId }),
        ...(status && { status }),
        page,
        size,
      },
    }),

  getPendingBookings: (page = 0, size = 10) =>
    api.get<PaginatedResponse<BookingDTO>>('/bookings/admin/pending', {
      params: { page, size },
    }),

  approve: (id: number) =>
    api.post<BookingDTO>(`/bookings/${id}/approve`),

  reject: (id: number, rejectionReason: string) =>
    api.post<BookingDTO>(`/bookings/${id}/reject`, {
      bookingId: id,
      rejectionReason,
    }),

  cancel: (id: number) =>
    api.post<BookingDTO>(`/bookings/${id}/cancel`),

  adminCancel: (id: number, reason: string) =>
    api.post<BookingDTO>(`/bookings/${id}/admin-cancel`, {
      reason,
    }),

  checkConflicts: (resourceId: number, startTime: string, endTime: string, excludeBookingId?: number) =>
    api.get<ConflictProbeResponse>('/bookings/conflicts', {
      params: {
        resourceId,
        startTime,
        endTime,
        ...(excludeBookingId && { excludeBookingId }),
      },
    }),
};
