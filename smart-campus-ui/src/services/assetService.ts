import { api } from '@/lib/axios';

export interface AssetDTO {
  id: number;
  name: string;
  description: string;
}

export const assetService = {
  getAll: () =>
    api.get<AssetDTO[]>('/assets'),
};
