import { api } from '@/lib/axios';

export type CourseOfferingStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED';

export interface CourseOfferingDTO {
  id: number;
  code: string;
  title: string;
  description?: string | null;
  semester: string;
  credits: number;
  capacity: number;
  enrolledCount: number;
  seatsAvailable: number;
  lecturerId?: number | null;
  lecturerName?: string | null;
  prerequisites?: string | null;
  status: CourseOfferingStatus;
}

export interface CreateCourseOfferingPayload {
  code: string;
  title: string;
  description?: string;
  semester: string;
  credits: number;
  capacity: number;
  lecturerId?: number | null;
  prerequisites?: string;
  status?: CourseOfferingStatus;
}

export const courseOfferingService = {
  list: (params?: { semester?: string; status?: CourseOfferingStatus }) =>
    api.get<CourseOfferingDTO[]>('/course-offerings', { params }),

  listMine: () => api.get<CourseOfferingDTO[]>('/course-offerings/mine'),

  getById: (id: number) => api.get<CourseOfferingDTO>(`/course-offerings/${id}`),

  create: (data: CreateCourseOfferingPayload) =>
    api.post<CourseOfferingDTO>('/course-offerings', data),

  update: (id: number, data: CreateCourseOfferingPayload) =>
    api.put<CourseOfferingDTO>(`/course-offerings/${id}`, data),

  updateStatus: (id: number, status: CourseOfferingStatus) =>
    api.patch<CourseOfferingDTO>(`/course-offerings/${id}/status`, null, {
      params: { status },
    }),

  delete: (id: number) => api.delete(`/course-offerings/${id}`),

  releaseGrades: (id: number) =>
    api.post<{ released: number }>(`/course-offerings/${id}/release-grades`),
};
