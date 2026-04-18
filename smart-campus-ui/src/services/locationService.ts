import { api } from '@/lib/axios';

export interface LocationDTO {
  id: number;
  block: string;
  floor: number;
  roomNumber: string;
  roomType: string;
  displayName: string;
}

export const locationService = {
  getAll: () =>
    api.get<LocationDTO[]>('/locations'),
};
