import { api } from '@/lib/axios';

export type EnrollmentStatus = 'ENROLLED' | 'WAITLISTED' | 'WITHDRAWN' | 'COMPLETED';

export type Grade =
  | 'A_PLUS' | 'A' | 'A_MINUS'
  | 'B_PLUS' | 'B' | 'B_MINUS'
  | 'C_PLUS' | 'C' | 'C_MINUS'
  | 'D_PLUS' | 'D'
  | 'F' | 'I' | 'W';

export const GRADE_OPTIONS: { value: Grade; label: string; points: number | null }[] = [
  { value: 'A_PLUS',  label: 'A+', points: 4.0 },
  { value: 'A',       label: 'A',  points: 4.0 },
  { value: 'A_MINUS', label: 'A-', points: 3.7 },
  { value: 'B_PLUS',  label: 'B+', points: 3.3 },
  { value: 'B',       label: 'B',  points: 3.0 },
  { value: 'B_MINUS', label: 'B-', points: 2.7 },
  { value: 'C_PLUS',  label: 'C+', points: 2.3 },
  { value: 'C',       label: 'C',  points: 2.0 },
  { value: 'C_MINUS', label: 'C-', points: 1.7 },
  { value: 'D_PLUS',  label: 'D+', points: 1.3 },
  { value: 'D',       label: 'D',  points: 1.0 },
  { value: 'F',       label: 'F',  points: 0.0 },
  { value: 'I',       label: 'I',  points: null },
  { value: 'W',       label: 'W',  points: null },
];

export interface EnrollmentDTO {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentRegistrationNumber?: string | null;

  offeringId: number;
  courseCode: string;
  courseTitle: string;
  semester: string;
  credits: number;

  status: EnrollmentStatus;
  grade?: Grade | null;
  gradeLabel?: string | null;
  gradePoints?: number | null;
  gradeReleased: boolean;
  gradeReleasedAt?: string | null;

  enrolledAt: string;
  withdrawnAt?: string | null;
}

export interface TranscriptDTO {
  studentId: number;
  studentName: string;
  studentRegistrationNumber?: string | null;
  gpa: number;
  creditsEarned: number;
  coursesCompleted: number;
  entries: EnrollmentDTO[];
}

export const enrollmentService = {
  enroll: (courseOfferingId: number) =>
    api.post<EnrollmentDTO>('/enrollments', { courseOfferingId }),

  withdraw: (id: number) => api.delete<EnrollmentDTO>(`/enrollments/${id}`),

  listMine: () => api.get<EnrollmentDTO[]>('/enrollments/me'),

  roster: (offeringId: number) =>
    api.get<EnrollmentDTO[]>(`/enrollments/course/${offeringId}`),

  setGrade: (enrollmentId: number, grade: Grade) =>
    api.put<EnrollmentDTO>(`/enrollments/${enrollmentId}/grade`, { grade }),

  transcript: () => api.get<TranscriptDTO>('/transcripts/me'),
};
