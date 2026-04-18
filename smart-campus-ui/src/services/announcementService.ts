import { api } from '@/lib/axios';
import type { NotificationPriority } from './notificationService';

export type AnnouncementAudience = 'ALL' | 'STUDENT' | 'LECTURER' | 'ADMIN';

export interface ScheduledAnnouncementDTO {
  id: number;
  title: string;
  message: string;
  link?: string | null;
  priority: NotificationPriority;
  audience: AnnouncementAudience;
  scheduledAt: string;
  sentAt?: string | null;
  recipientCount?: number | null;
  createdByName?: string | null;
  createdAt: string;
}

export interface CreateScheduledAnnouncementRequest {
  title: string;
  message: string;
  link?: string;
  priority: NotificationPriority;
  audience: AnnouncementAudience;
  scheduledAt: string; // ISO local-datetime
}

export const announcementService = {
  list: () => api.get<ScheduledAnnouncementDTO[]>('/admin/announcements'),
  create: (req: CreateScheduledAnnouncementRequest) =>
    api.post<ScheduledAnnouncementDTO>('/admin/announcements', req),
  cancel: (id: number) => api.delete(`/admin/announcements/${id}`),
};
