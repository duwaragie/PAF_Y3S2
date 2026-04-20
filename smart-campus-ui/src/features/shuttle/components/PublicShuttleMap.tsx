import { useEffect, useMemo, useState } from 'react';
import ShuttleMapView from './ShuttleMapView';
import { shuttleService } from '@/services/shuttleService';
import { useShuttleStore } from '@/store/shuttleStore';

export function PublicShuttleMap() {
  const { activeRoutes, setActiveRoutes, isLoading, setLoading, error, setError } = useShuttleStore();
  const [hiddenRouteIds, setHiddenRouteIds] = useState<Set<number>>(new Set());

  const visibleRoutes = useMemo(
    () => activeRoutes.filter(r => !hiddenRouteIds.has(r.id)),
    [activeRoutes, hiddenRouteIds]
  );

  const toggleRoute = (id: number) => {
    setHiddenRouteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await shuttleService.getActiveRoutes();
        setActiveRoutes(res.data);
      } catch {
        setError('Failed to load shuttle routes.');
      } finally {
        setLoading(false);
      }
    };
    void loadRoutes();
  }, [setLoading, setError, setActiveRoutes]);

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-campus-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-red-50 text-red-600 rounded-2xl border border-red-100 p-6 text-center">
        <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm font-bold">Unable to load map</p>
        <p className="text-xs mt-1">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[420px] relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
      <ShuttleMapView
        routes={visibleRoutes}
        interactive={true}
        hideMarkers={true}
      />
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow border border-gray-100 pointer-events-none">
        <h3 className="text-xs font-bold text-campus-900 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-campus-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          Live Shuttle Routes
        </h3>
        <p className="text-[10px] text-gray-500 mt-0.5">{visibleRoutes.length} of {activeRoutes.length} routes shown</p>
      </div>

      {/* Route toggles (bottom-left) */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur p-2 rounded-lg shadow border border-gray-100">
        <div className="space-y-1">
          {activeRoutes.map(route => {
            const hidden = hiddenRouteIds.has(route.id);
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => toggleRoute(route.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${hidden ? 'opacity-40 hover:opacity-60' : 'hover:bg-gray-50'}`}
              >
                <span
                  className={`w-3 h-3 rounded-full shrink-0 border ${hidden ? 'bg-white' : ''}`}
                  style={{
                    backgroundColor: hidden ? undefined : (route.color || '#3b82f6'),
                    borderColor: route.color || '#3b82f6',
                  }}
                />
                <span className="text-[11px] font-semibold text-gray-700 whitespace-nowrap">{route.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
