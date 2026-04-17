import { api } from '@/lib/axios';

export interface ResourceDTO {
  id: number;
  name: string;
  type: 'LECTURE_HALL' | 'LAB' | 'MEETING_ROOM' | 'EQUIPMENT';
  capacity: number | null;
  location: string;
  availabilityWindows: string;
  status: 'ACTIVE' | 'OUT_OF_SERVICE' | 'UNDER_MAINTENANCE';
  imageUrl?: string;
  assetIds?: number[];
  amenityIds?: number[];
}

export interface ResourceSearchParams {
  type?: string;
  status?: string;
  location?: string;
  minCapacity?: number;
}

export const resourceService = {
  getAll: () =>
    api.get<ResourceDTO[]>('/resources'),

  search: (params: ResourceSearchParams) =>
    api.get<ResourceDTO[]>('/resources/search', { params }),

  getById: (id: number) =>
    api.get<ResourceDTO>(`/resources/${id}`),

  create: (data: Omit<ResourceDTO, 'id'>) =>
    api.post<ResourceDTO>('/resources', data),

  update: (id: number, data: Omit<ResourceDTO, 'id'>) =>
    api.put<ResourceDTO>(`/resources/${id}`, data),

  delete: (id: number) =>
    api.delete(`/resources/${id}`),
};
