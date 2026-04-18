import { api } from '@/lib/axios';

export type NotificationType =
  | 'ENROLLMENT_CONFIRMED'
  | 'ENROLLMENT_WAITLISTED'
  | 'WAITLIST_PROMOTED'
  | 'ENROLLMENT_WITHDRAWN'
  | 'GRADE_RELEASED'
  | 'COURSE_STATUS_CHANGED'
  | 'BOOKING_CREATED'
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'TICKET_CREATED'
  | 'TICKET_ASSIGNED'
  | 'TICKET_UPDATED'
  | 'TICKET_RESOLVED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'ANNOUNCEMENT'
  | 'GENERAL';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface NotificationDTO {
  id: number;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

/**
 * Global channel toggles. In-app is not user-toggleable (always on) — the
 * backend guarantees at least one delivery method, so it's not in the DTO.
 */
export interface NotificationPreferenceDTO {
  email: boolean;
  push: boolean;
}

export const notificationService = {
  list: (limit = 50) => api.get<NotificationDTO[]>('/notifications/me', { params: { limit } }),
  unreadCount: () => api.get<{ count: number }>('/notifications/me/unread-count'),
  markRead: (id: number) => api.patch<NotificationDTO>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ updated: number }>('/notifications/me/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
  getPreferences: () => api.get<NotificationPreferenceDTO>('/notifications/preferences'),
  updatePreferences: (pref: Partial<NotificationPreferenceDTO>) =>
    api.put<NotificationPreferenceDTO>('/notifications/preferences', pref),
};
