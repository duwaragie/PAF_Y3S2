import { api } from '@/lib/axios';

export interface UserDTO {
  id: number;
  email: string;
  name: string;
  picture: string;
  role: string;
  studentRegistrationNumber?: string | null;
  employeeId?: string | null;
  profileComplete?: boolean;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'LECTURER' | 'ADMIN';
}

export const adminService = {
  getAllUsers: () =>
    api.get<UserDTO[]>('/admin/users'),

  getUserById: (id: number) =>
    api.get<UserDTO>(`/admin/users/${id}`),

  updateUserRole: (id: number, role: string) =>
    api.put<UserDTO>(`/admin/users/${id}/role`, null, { params: { role } }),

  deleteUser: (id: number) =>
    api.delete(`/admin/users/${id}`),

  createUser: (data: CreateUserPayload) =>
    api.post<UserDTO>('/admin/users', data),

  assignIdentifier: (
    id: number,
    payload: { studentRegistrationNumber?: string; employeeId?: string }
  ) => api.patch<UserDTO>(`/admin/users/${id}/identifier`, null, { params: payload }),
};
