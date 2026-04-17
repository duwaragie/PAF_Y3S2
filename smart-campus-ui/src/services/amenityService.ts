import { api } from '@/lib/axios';

export interface AmenityDTO {
  id: number;
  name: string;
  description: string;
}

export const amenityService = {
  getAll: () =>
    api.get<AmenityDTO[]>('/amenities'),

  getById: (id: number) =>
    api.get<AmenityDTO>(`/amenities/${id}`),

  create: (data: Omit<AmenityDTO, 'id'>) =>
    api.post<AmenityDTO>('/amenities', data),

  update: (id: number, data: Omit<AmenityDTO, 'id'>) =>
    api.put<AmenityDTO>(`/amenities/${id}`, data),

  delete: (id: number) =>
    api.delete(`/amenities/${id}`),
};
