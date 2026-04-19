import { api } from '@/lib/axios';

export interface ShuttleRouteDTO {
  id: number;
  name: string;
  originName: string;
  destinationName: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  polyline: string;
  color: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const shuttleService = {
  // Public endpoint
  getActiveRoutes: () =>
    api.get<ShuttleRouteDTO[]>('/shuttle/routes'),

  // Admin endpoints
  getAllRoutes: () =>
    api.get<ShuttleRouteDTO[]>('/admin/shuttle/routes'),

  createRoute: (data: Omit<ShuttleRouteDTO, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<ShuttleRouteDTO>('/admin/shuttle/routes', data),

  updateRoute: (id: number, data: Omit<ShuttleRouteDTO, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.put<ShuttleRouteDTO>(`/admin/shuttle/routes/${id}`, data),

  toggleActive: (id: number) =>
    api.patch<ShuttleRouteDTO>(`/admin/shuttle/routes/${id}/toggle-active`),

  deleteRoute: (id: number) =>
    api.delete(`/admin/shuttle/routes/${id}`),
};
