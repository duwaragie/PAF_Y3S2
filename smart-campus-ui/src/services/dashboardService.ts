import { api } from '@/lib/axios';

export interface StudentDashboardSummary {
  activeEnrollments: number;
  waitlisted: number;
  coursesCompleted: number;
  gpa: number;
  creditsEarned: number;
  unreadNotifications: number;
}

export interface LecturerDashboardSummary {
  sectionsInCharge: number;
  offeringsInCharge: number;
  totalStudents: number;
  pendingGrades: number;
  gradedPendingRelease: number;
  releasedGrades: number;
  unreadNotifications: number;
  courseCodes: string[];
}

export const dashboardService = {
  studentSummary: () => api.get<StudentDashboardSummary>('/dashboard/student/summary'),
  lecturerSummary: () => api.get<LecturerDashboardSummary>('/dashboard/lecturer/summary'),
};
