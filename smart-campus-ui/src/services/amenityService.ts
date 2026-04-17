import { api } from '@/lib/axios';

export interface AmenityDTO {
  id: number;
  name: string;
  description: string;
}

export const amenityService = {
  getAll: () =>
    api.get<AmenityDTO[]>('/amenities'),
};
