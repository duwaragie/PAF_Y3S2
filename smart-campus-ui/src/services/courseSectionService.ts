import { api } from '@/lib/axios';

export interface CourseSectionDTO {
  id: number;
  offeringId: number;
  courseCode: string;
  courseTitle: string;
  semester: string;
  credits: number;
  label: string;
  capacity: number;
  enrolledCount: number;
  seatsAvailable: number;
  lecturerId?: number | null;
  lecturerName?: string | null;
}

export interface CreateCourseSectionPayload {
  label: string;
  capacity: number;
  lecturerId?: number | null;
}

export const courseSectionService = {
  listByOffering: (offeringId: number) =>
    api.get<CourseSectionDTO[]>(`/course-offerings/${offeringId}/sections`),

  create: (offeringId: number, data: CreateCourseSectionPayload) =>
    api.post<CourseSectionDTO>(`/course-offerings/${offeringId}/sections`, data),

  getById: (id: number) => api.get<CourseSectionDTO>(`/course-sections/${id}`),

  update: (id: number, data: CreateCourseSectionPayload) =>
    api.put<CourseSectionDTO>(`/course-sections/${id}`, data),

  delete: (id: number) => api.delete(`/course-sections/${id}`),

  listMine: () => api.get<CourseSectionDTO[]>('/course-sections/mine'),
};
