import { useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ShuttleMapView from '@/features/shuttle/components/ShuttleMapView';
import { shuttleService } from '@/services/shuttleService';
import { useShuttleStore } from '@/store/shuttleStore';

export default function DashboardShuttleMap() {
  const { activeRoutes, setActiveRoutes, isLoading, setLoading, error, setError, selectedRoute, setSelectedRoute } = useShuttleStore();

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await shuttleService.getActiveRoutes();
        setActiveRoutes(res.data);
      } catch (err) {
        setError('Failed to load shuttle routes.');
      } finally {
        setLoading(false);
      }
    };
    void loadRoutes();
  }, [setLoading, setError, setActiveRoutes]);

  return (
    <AppLayout>
      <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-campus-900">Campus Shuttle Routes</h1>
          <p className="text-sm text-gray-500 mt-1">View active shuttle routes, stops, and schedules.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2 shrink-0">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
          {/* Sidebar Route List */}
          <div className="w-full md:w-80 shrink-0 flex flex-col gap-4 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-sm font-bold text-gray-900 px-2">Available Routes</h2>
            
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-campus-600 rounded-full animate-spin" />
              </div>
            ) : activeRoutes.length > 0 ? (
              <div className="space-y-2">
                {activeRoutes.map(route => (
                  <button
                    key={route.id}
                    onClick={() => setSelectedRoute(selectedRoute?.id === route.id ? null : route)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedRoute?.id === route.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50 hover:border-gray-200'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: route.color || '#3b82f6' }} />
                      <p className="text-sm font-bold text-gray-900">{route.name}</p>
                    </div>
                    <div className="pl-6 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                        <span className="font-medium text-gray-700">{route.originName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        <span className="font-medium text-gray-700">{route.destinationName}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic px-2">No active shuttle routes available at the moment.</p>
            )}
          </div>

          {/* Map View */}
          <div className="flex-1 min-h-[400px] md:min-h-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 relative">
            <ShuttleMapView 
              routes={activeRoutes}
              selectedRouteId={selectedRoute?.id}
              onRouteClick={(route) => setSelectedRoute(route)}
              interactive={true}
            />
            {selectedRoute && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-sm border border-gray-100 pointer-events-none">
                <p className="text-xs font-bold text-gray-900">Selected Route</p>
                <p className="text-[10px] text-gray-500 font-medium">{selectedRoute.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
