import { create } from 'zustand';
import { type ShuttleRouteDTO } from '@/services/shuttleService';

interface ShuttleState {
  routes: ShuttleRouteDTO[];
  activeRoutes: ShuttleRouteDTO[];
  selectedRoute: ShuttleRouteDTO | null;
  isLoading: boolean;
  error: string | null;
  
  setRoutes: (routes: ShuttleRouteDTO[]) => void;
  setActiveRoutes: (routes: ShuttleRouteDTO[]) => void;
  setSelectedRoute: (route: ShuttleRouteDTO | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useShuttleStore = create<ShuttleState>((set) => ({
  routes: [],
  activeRoutes: [],
  selectedRoute: null,
  isLoading: false,
  error: null,
  
  setRoutes: (routes) => set({ routes }),
  setActiveRoutes: (activeRoutes) => set({ activeRoutes }),
  setSelectedRoute: (selectedRoute) => set({ selectedRoute }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
