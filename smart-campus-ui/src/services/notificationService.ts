import { api } from '@/lib/axios';

export type NotificationType =
  | 'ENROLLMENT_CONFIRMED'
  | 'ENROLLMENT_WAITLISTED'
  | 'WAITLIST_PROMOTED'
  | 'ENROLLMENT_WITHDRAWN'
  | 'GRADE_RELEASED'
  | 'COURSE_STATUS_CHANGED'
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

export const notificationService = {
  list: (limit = 50) => api.get<NotificationDTO[]>('/notifications/me', { params: { limit } }),
  unreadCount: () => api.get<{ count: number }>('/notifications/me/unread-count'),
  markRead: (id: number) => api.patch<NotificationDTO>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ updated: number }>('/notifications/me/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};
