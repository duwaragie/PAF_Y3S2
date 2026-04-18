import { api } from '@/lib/axios';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface ResourceAvailabilityDTO {
  id?: number;
  resourceId?: number;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm:ss or HH:mm
  endTime: string;   // HH:mm:ss or HH:mm
}

export interface ResourceDTO {
  id: number;
  name: string;
  type: 'LECTURE_HALL' | 'LAB' | 'MEETING_ROOM' | 'EQUIPMENT';
  capacity: number | null;
  locationId: number | null;
  locationName?: string;
  status: 'ACTIVE' | 'OUT_OF_SERVICE' | 'UNDER_MAINTENANCE';
  imageUrl?: string;
  assetIds?: number[];
  amenityIds?: number[];
  availabilities?: ResourceAvailabilityDTO[];
}

export interface ResourceSearchParams {
  type?: string;
  status?: string;
  locationId?: number;
  minCapacity?: number;
  assetIds?: number[];
  amenityIds?: number[];
}

export const resourceService = {
  getAll: () =>
    api.get<ResourceDTO[]>('/resources'),

  search: (params: ResourceSearchParams) =>
    api.get<ResourceDTO[]>('/resources/search', { params }),

  getById: (id: number) =>
    api.get<ResourceDTO>(`/resources/${id}`),

  create: (data: Omit<ResourceDTO, 'id' | 'locationName'>) =>
    api.post<ResourceDTO>('/resources', data),

  update: (id: number, data: Omit<ResourceDTO, 'id' | 'locationName'>) =>
    api.put<ResourceDTO>(`/resources/${id}`, data),

  delete: (id: number) =>
    api.delete(`/resources/${id}`),

  // Availability specific endpoints
  getAvailabilities: (resourceId: number) =>
    api.get<ResourceAvailabilityDTO[]>(`/resources/${resourceId}/availability`),

  updateAvailabilities: (resourceId: number, data: ResourceAvailabilityDTO[]) =>
    api.put<ResourceAvailabilityDTO[]>(`/resources/${resourceId}/availability`, data),
};
