import { api } from '@/lib/axios';

export interface AssetDTO {
  id: number;
  name: string;
  description: string;
}

export const assetService = {
  getAll: () =>
    api.get<AssetDTO[]>('/assets'),

  getById: (id: number) =>
    api.get<AssetDTO>(`/assets/${id}`),

  create: (data: Omit<AssetDTO, 'id'>) =>
    api.post<AssetDTO>('/assets', data),

  update: (id: number, data: Omit<AssetDTO, 'id'>) =>
    api.put<AssetDTO>(`/assets/${id}`, data),

  delete: (id: number) =>
    api.delete(`/assets/${id}`),
};
