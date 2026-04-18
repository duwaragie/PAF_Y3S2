import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { resourceService, type ResourceDTO, type ResourceSearchParams } from '@/services/resourceService';
import { assetService, type AssetDTO } from '@/services/assetService';
import { amenityService, type AmenityDTO } from '@/services/amenityService';
import { FacilityDetailModal } from '@/features/facilities/components/FacilityDetailModal';

const TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'] as const;

const typeLabels: Record<string, string> = {
  LECTURE_HALL: 'Lecture Hall',
  LAB: 'Lab',
  MEETING_ROOM: 'Meeting Room',
  EQUIPMENT: 'Equipment',
};

export default function FacilitiesCataloguePage() {
  const [resources, setResources] = useState<ResourceDTO[]>([]);
  const [availableAssets, setAvailableAssets] = useState<AssetDTO[]>([]);
  const [availableAmenities, setAvailableAmenities] = useState<AmenityDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useState<ResourceSearchParams>({ status: 'ACTIVE' });

  // Modal State
  const [selectedFacility, setSelectedFacility] = useState<ResourceDTO | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const cleanParams = Object.fromEntries(
          Object.entries(searchParams).filter(([, v]) => {
            if (Array.isArray(v)) return v.length > 0;
            return v !== '' && v != null;
          })
        );
        const res = Object.keys(cleanParams).length > 0
          ? await resourceService.search(cleanParams)
          : await resourceService.getAll();
        setResources(res.data);
      } catch {
        setError('Failed to load resources.');
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [searchParams]);

  useEffect(() => {
    const loadCatalogues = async () => {
      try {
        const [resAssets, resAmenities] = await Promise.all([
          assetService.getAll().catch(() => ({ data: [] })),
          amenityService.getAll().catch(() => ({ data: [] })),
        ]);
        setAvailableAssets(resAssets.data);
        setAvailableAmenities(resAmenities.data);
      } catch {
        // non-blocking
      }
    };
    void loadCatalogues();
  }, []);

  const resetFilters = () => setSearchParams({ status: 'ACTIVE' });
  const hasExtraFilters = (['type', 'location', 'minCapacity', 'assetIds', 'amenityIds'] as const).some(
    (k) => {
      const v = searchParams[k];
      if (Array.isArray(v)) return v.length > 0;
      return v !== '' && v != null;
    }
  );

  const toggleAssetFilter = (id: number) => {
    setSearchParams((prev) => {
      const current = prev.assetIds || [];
      return {
        ...prev,
        assetIds: current.includes(id) ? current.filter((a) => a !== id) : [...current, id],
      };
    });
  };

  const toggleAmenityFilter = (id: number) => {
    setSearchParams((prev) => {
      const current = prev.amenityIds || [];
      return {
        ...prev,
        amenityIds: current.includes(id) ? current.filter((a) => a !== id) : [...current, id],
      };
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-campus-900">Campus Facilities & Assets</h1>
          <p className="text-sm text-gray-500 mt-1">Browse available lecture halls, labs, meeting rooms, and equipment.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
              <select 
                value={searchParams.type || ''} 
                onChange={(e) => setSearchParams({...searchParams, type: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors"
              >
                <option value="">All Types</option>
                {TYPES.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
              </select>
            </div>
            
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
              <input 
                type="text"
                placeholder="e.g. Block A"
                value={searchParams.location || ''} 
                onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors placeholder:text-gray-400"
              />
            </div>

            <div className="w-[120px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Min. Capacity</label>
              <input 
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={searchParams.minCapacity || ''} 
                onChange={(e) => setSearchParams({...searchParams, minCapacity: e.target.value ? Number(e.target.value) : undefined})}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors placeholder:text-gray-400"
              />
            </div>

            {hasExtraFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-10 px-4 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-lg transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {(availableAssets.length > 0 || availableAmenities.length > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              {availableAssets.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assets</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableAssets.map((a) => {
                      const active = (searchParams.assetIds || []).includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleAssetFilter(a.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-200'}`}
                        >
                          {a.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {availableAmenities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableAmenities.map((a) => {
                      const active = (searchParams.amenityIds || []).includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleAmenityFilter(a.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-purple-50 hover:border-purple-200'}`}
                        >
                          {a.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Name', 'Type', 'Capacity', 'Location', 'Availability'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr 
                      key={r.id} 
                      onClick={() => setSelectedFacility(r)}
                      className="border-b border-gray-50 hover:bg-campus-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-campus-800 group-hover:text-campus-900">{r.name}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-600">
                          {typeLabels[r.type] || r.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {r.capacity ? <span className="font-semibold">{r.capacity} pax</span> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{r.location || '—'}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{r.availabilityWindows || '—'}</td>
                    </tr>
                  ))}
                  {resources.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">No facilities found</p>
                          <p className="text-xs text-gray-500">Adjust your search filters to find resources.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {resources.length > 0 && (
              <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Showing {resources.length} result{resources.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        <FacilityDetailModal 
          isOpen={!!selectedFacility}
          onClose={() => setSelectedFacility(null)}
          resource={selectedFacility}
          mode="view"
          availableAssets={availableAssets}
          availableAmenities={availableAmenities}
        />
      </div>
    </AppLayout>
  );
}
