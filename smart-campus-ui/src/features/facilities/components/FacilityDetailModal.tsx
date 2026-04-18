import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ResourceDTO, type DayOfWeek } from '@/services/resourceService';
import { type AssetDTO } from '@/services/assetService';
import { type AmenityDTO } from '@/services/amenityService';
import { formatAvailabilitySummary } from '@/utils/scheduleUtils';

const WEEK_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MONDAY', label: 'Mon' },
  { key: 'TUESDAY', label: 'Tue' },
  { key: 'WEDNESDAY', label: 'Wed' },
  { key: 'THURSDAY', label: 'Thu' },
  { key: 'FRIDAY', label: 'Fri' },
  { key: 'SATURDAY', label: 'Sat' },
  { key: 'SUNDAY', label: 'Sun' },
];

interface FacilityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: ResourceDTO | null;
  mode: 'view' | 'edit';
  onEdit?: (resource: ResourceDTO) => void;
  onDelete?: (resource: ResourceDTO) => void;
  availableAssets: AssetDTO[];
  availableAmenities: AmenityDTO[];
}

const typeLabels: Record<string, string> = {
  LECTURE_HALL: 'Lecture Hall',
  LAB: 'Lab',
  MEETING_ROOM: 'Meeting Room',
  EQUIPMENT: 'Equipment',
};

const statusStyle: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  OUT_OF_SERVICE: 'bg-red-100 text-red-700',
  UNDER_MAINTENANCE: 'bg-amber-100 text-amber-700',
};

export function FacilityDetailModal({
  isOpen,
  onClose,
  resource,
  mode,
  onEdit,
  onDelete,
  availableAssets,
  availableAmenities,
}: FacilityDetailModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !resource) return null;

  const resourceAssets = availableAssets.filter(a => resource.assetIds?.includes(a.id));
  const resourceAmenities = availableAmenities.filter(a => resource.amenityIds?.includes(a.id));

  // Map availability by dayOfWeek for the visual grid.
  const availabilityByDay = new Map<DayOfWeek, { startTime: string; endTime: string }>();
  (resource.availabilities ?? []).forEach((a) => {
    availabilityByDay.set(a.dayOfWeek, { startTime: a.startTime, endTime: a.endTime });
  });
  const trimTime = (t: string) => (t.length >= 5 ? t.slice(0, 5) : t);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-2xl my-8 animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-campus-900">{resource.name}</h2>
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${statusStyle[resource.status]}`}>
              {resource.status.replace(/_/g, ' ')}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Image */}
            <div className="w-full md:w-1/3 shrink-0">
              {resource.imageUrl ? (
                <img src={resource.imageUrl} alt={resource.name} className="w-full aspect-[4/3] object-cover rounded-xl border border-gray-100 shadow-sm" />
              ) : (
                <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <span className="text-xs font-medium">No Image Available</span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="w-full md:w-2/3 space-y-4">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Facility Type</p>
                <p className="text-sm font-semibold text-campus-800">{typeLabels[resource.type] || resource.type}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                  <p className="text-sm text-gray-700">{resource.locationName || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Capacity</p>
                  <p className="text-sm text-gray-700">{resource.capacity ? `${resource.capacity} people` : 'Not specified'}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Availability</p>
                {availabilityByDay.size === 0 ? (
                  <p className="text-xs text-gray-500 italic">Not specified</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {WEEK_DAYS.map(({ key, label }) => {
                        const open = availabilityByDay.get(key);
                        return (
                          <div
                            key={key}
                            className={`flex flex-col items-center min-w-[44px] px-1.5 py-1.5 rounded-lg border text-[10px] ${
                              open
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                : 'bg-gray-50 border-gray-100 text-gray-400'
                            }`}
                            title={open ? `${trimTime(open.startTime)} – ${trimTime(open.endTime)}` : 'Closed'}
                          >
                            <span className="font-bold uppercase tracking-wider">{label}</span>
                            <span className="mt-0.5 tabular-nums">
                              {open ? `${trimTime(open.startTime)}–${trimTime(open.endTime)}` : 'Closed'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">{formatAvailabilitySummary(resource.availabilities)}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-100 mb-6" />

          {/* Assets & Amenities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-campus-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
                Included Assets
              </h3>
              {resourceAssets.length > 0 ? (
                <ul className="space-y-2">
                  {resourceAssets.map(asset => (
                    <li key={asset.id} className="flex flex-col bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-100/50">
                      <span className="text-xs font-semibold text-blue-900">{asset.name}</span>
                      {asset.description && <span className="text-[10px] text-blue-600/70 mt-0.5">{asset.description}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic bg-gray-50 px-3 py-2 rounded-lg">No special assets assigned.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-campus-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H9a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 009 19.5z" />
                </svg>
                Included Amenities
              </h3>
              {resourceAmenities.length > 0 ? (
                <ul className="space-y-2">
                  {resourceAmenities.map(amenity => (
                    <li key={amenity.id} className="flex flex-col bg-purple-50/50 px-3 py-2 rounded-lg border border-purple-100/50">
                      <span className="text-xs font-semibold text-purple-900">{amenity.name}</span>
                      {amenity.description && <span className="text-[10px] text-purple-600/70 mt-0.5">{amenity.description}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic bg-gray-50 px-3 py-2 rounded-lg">No special amenities assigned.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions (Admin Only) */}
        {mode === 'edit' && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 shrink-0 bg-gray-50/50 rounded-b-2xl">
            <button
              onClick={() => { onClose(); onDelete?.(resource); }}
              className="h-10 px-5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              Delete Facility
            </button>
            <button
              onClick={() => { onClose(); onEdit?.(resource); }}
              className="h-10 px-6 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 transition-colors shadow-sm"
            >
              Edit Details
            </button>
          </div>
        )}
        
        {/* Footer Actions (Student Only - Booking hook) */}
        {mode === 'view' && resource.status === 'ACTIVE' && (
          <div className="flex items-center justify-end p-5 border-t border-gray-100 shrink-0 bg-gray-50/50 rounded-b-2xl">
            <button
              onClick={() => {
                onClose();
                navigate(`/bookings?resourceId=${resource.id}`);
              }}
              className="h-10 px-6 bg-campus-600 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Book this Facility
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
