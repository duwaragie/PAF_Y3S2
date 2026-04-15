import { api } from '@/lib/axios';
import type { User } from '@/store/authStore';

export interface UpdateProfilePayload {
  name: string;
  picture?: string;
  studentRegistrationNumber?: string;
  employeeId?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  getProfile: () => api.get<User>('/users/profile'),
  updateProfile: (data: UpdateProfilePayload) => api.put<User>('/users/profile', data),
  changePassword: (data: ChangePasswordPayload) =>
    api.put<{ message: string }>('/users/profile/password', data),
};
