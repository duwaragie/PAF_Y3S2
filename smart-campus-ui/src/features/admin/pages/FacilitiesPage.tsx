import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { resourceService, type ResourceDTO, type ResourceSearchParams, type ResourceAvailabilityDTO, type DayOfWeek } from '@/services/resourceService';
import { assetService, type AssetDTO } from '@/services/assetService';
import { amenityService, type AmenityDTO } from '@/services/amenityService';
import { locationService, type LocationDTO } from '@/services/locationService';
import { storageService } from '@/services/storageService';
import { FacilityDetailModal } from '@/features/facilities/components/FacilityDetailModal';
import { formatAvailabilitySummary } from '@/utils/scheduleUtils';

const TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'] as const;
const STATUSES = ['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'] as const;
const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
};

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

type FormState = {
  name: string;
  type: ResourceDTO['type'];
  capacity: string;
  locationId: number | '';
  status: ResourceDTO['status'];
  assetIds: number[];
  amenityIds: number[];
  availabilities: Partial<Record<DayOfWeek, { enabled: boolean; startTime: string; endTime: string }>>;
};

const defaultAvailabilities: FormState['availabilities'] = {};
DAYS.forEach(day => {
  defaultAvailabilities[day] = { enabled: false, startTime: '08:00', endTime: '18:00' };
});

const emptyForm: FormState = {
  name: '',
  type: 'LAB',
  capacity: '',
  locationId: '',
  status: 'ACTIVE',
  assetIds: [],
  amenityIds: [],
  availabilities: JSON.parse(JSON.stringify(defaultAvailabilities)),
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function FacilitiesPage() {
  const [resources, setResources] = useState<ResourceDTO[]>([]);
  const [availableAssets, setAvailableAssets] = useState<AssetDTO[]>([]);
  const [availableAmenities, setAvailableAmenities] = useState<AmenityDTO[]>([]);
  const [availableLocations, setAvailableLocations] = useState<LocationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useState<ResourceSearchParams>({});

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  
  // Modal State
  const [selectedFacility, setSelectedFacility] = useState<ResourceDTO | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ResourceDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Image Upload/Paste State
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pastedImageUrl, setPastedImageUrl] = useState<string>('');
  const [imagePreviewError, setImagePreviewError] = useState<boolean>(false);

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
        const [resAssets, resAmenities, resLocations] = await Promise.all([
          assetService.getAll().catch(() => ({ data: [] })),
          amenityService.getAll().catch(() => ({ data: [] })),
          locationService.getAll().catch(() => ({ data: [] })),
        ]);
        setAvailableAssets(resAssets.data);
        setAvailableAmenities(resAmenities.data);
        setAvailableLocations(resLocations.data);
      } catch {
        // non-blocking
      }
    };
    void loadCatalogues();
  }, []);

  const resetFilters = () => setSearchParams({});

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

  const hasActiveFilters = Object.values(searchParams).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== '' && v != null;
  });

  const clearMessages = () => { setError(null); setSuccess(null); };

  const openCreate = () => {
    setForm(JSON.parse(JSON.stringify(emptyForm)));
    setFormErrors({});
    setEditingId(null);
    setImageFile(null);
    setPastedImageUrl('');
    setImageUploadMode('upload');
    setImagePreviewError(false);
    setShowForm(true);
    setSelectedFacility(null);
    clearMessages();
  };

  const openEdit = (r: ResourceDTO) => {
    // Reconstruct availabilities for form state
    const editAvail: FormState['availabilities'] = JSON.parse(JSON.stringify(defaultAvailabilities));
    if (r.availabilities) {
      r.availabilities.forEach(a => {
        editAvail[a.dayOfWeek] = {
          enabled: true,
          startTime: a.startTime.substring(0, 5), // strip seconds if any
          endTime: a.endTime.substring(0, 5),
        };
      });
    }

    setForm({
      name: r.name,
      type: r.type,
      capacity: r.capacity?.toString() || '',
      locationId: r.locationId || '',
      status: r.status,
      assetIds: r.assetIds || [],
      amenityIds: r.amenityIds || [],
      availabilities: editAvail,
    });
    setFormErrors({});
    setEditingId(r.id);
    
    // Set up image state based on existing URL
    setImageFile(null);
    setImagePreviewError(false);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const isSupabaseImage = supabaseUrl && r.imageUrl?.startsWith(supabaseUrl);
    
    if (r.imageUrl && !isSupabaseImage) {
      setImageUploadMode('url');
      setPastedImageUrl(r.imageUrl);
    } else {
      setImageUploadMode('upload');
      setPastedImageUrl('');
    }

    setShowForm(true);
    setSelectedFacility(null);
    clearMessages();
  };

  const handleRowClick = (r: ResourceDTO) => {
    setSelectedFacility(r);
  };

  const toggleAsset = (id: number) => {
    setForm((prev) => ({
      ...prev,
      assetIds: prev.assetIds.includes(id)
        ? prev.assetIds.filter((a) => a !== id)
        : [...prev.assetIds, id],
    }));
  };

  const toggleAmenity = (id: number) => {
    setForm((prev) => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(id)
        ? prev.amenityIds.filter((a) => a !== id)
        : [...prev.amenityIds, id],
    }));
  };

  const updateAvailability = (day: DayOfWeek, field: 'enabled' | 'startTime' | 'endTime', value: boolean | string) => {
    setForm(prev => ({
      ...prev,
      availabilities: {
        ...prev.availabilities,
        [day]: {
          ...prev.availabilities[day],
          [field]: value
        }
      }
    }));
  };

  const copyToAllWeekdays = () => {
    const monday = form.availabilities['MONDAY'];
    if (!monday) return;
    
    setForm(prev => {
      const newAvail = { ...prev.availabilities };
      ['TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].forEach(day => {
        newAvail[day as DayOfWeek] = { ...monday };
      });
      return { ...prev, availabilities: newAvail };
    });
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (form.locationId === '') errors.locationId = 'Location is required';
    if (form.capacity && (isNaN(parseInt(form.capacity)) || parseInt(form.capacity) < 1)) {
      errors.capacity = 'Capacity must be a positive number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSaving(true);
      clearMessages();

      let finalImageUrl: string | undefined = editingId ? resources.find(r => r.id === editingId)?.imageUrl : undefined;

      if (imageUploadMode === 'upload' && imageFile) {
        finalImageUrl = await storageService.upload(imageFile, 'resources');
      } else if (imageUploadMode === 'url' && pastedImageUrl.trim() !== '') {
        finalImageUrl = pastedImageUrl.trim();
      } else if (imageUploadMode === 'upload' && !imageFile && !editingId) {
        finalImageUrl = undefined;
      } else if (imageUploadMode === 'url' && pastedImageUrl.trim() === '') {
        finalImageUrl = undefined;
      }

      // Convert form availabilities to DTO array
      const availabilitiesList: ResourceAvailabilityDTO[] = [];
      DAYS.forEach(day => {
        const a = form.availabilities[day];
        if (a && a.enabled) {
          availabilitiesList.push({
            dayOfWeek: day,
            startTime: a.startTime + ':00', // add seconds for backend LocalTime
            endTime: a.endTime + ':00'
          });
        }
      });

      const payload = {
        name: form.name.trim(),
        type: form.type,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        locationId: form.locationId !== '' ? Number(form.locationId) : null,
        status: form.status,
        assetIds: form.assetIds,
        amenityIds: form.amenityIds,
        imageUrl: finalImageUrl,
        availabilities: availabilitiesList,
      };

      if (editingId) {
        const res = await resourceService.update(editingId, payload);
        setResources((prev) => prev.map((r) => r.id === editingId ? res.data : r));
        setSuccess(`"${res.data.name}" updated successfully.`);
      } else {
        const res = await resourceService.create(payload);
        setResources((prev) => [...prev, res.data]);
        setSuccess(`"${res.data.name}" created successfully.`);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch {
      setError(editingId ? 'Failed to update resource.' : 'Failed to create resource.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resourceToDelete: ResourceDTO) => {
    try {
      setDeleting(true);
      clearMessages();

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      if (resourceToDelete.imageUrl && supabaseUrl && resourceToDelete.imageUrl.startsWith(supabaseUrl)) {
        await storageService.remove(resourceToDelete.imageUrl);
      }

      await resourceService.delete(resourceToDelete.id);
      setResources((prev) => prev.filter((r) => r.id !== resourceToDelete.id));
      setSuccess(`"${resourceToDelete.name}" has been deleted.`);
      setSelectedFacility(null);
    } catch {
      setError('Failed to delete resource.');
    } finally {
      setDeleting(false);
    }
  };

  const editingResource = editingId ? resources.find(r => r.id === editingId) : null;

  return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-campus-900">Facilities & Assets Catalogue</h1>
              <p className="text-sm text-gray-500 mt-1">Manage bookable resources: lecture halls, labs, meeting rooms, and equipment.</p>
            </div>
            <button onClick={openCreate} className="shrink-0 h-10 px-5 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 transition-colors shadow-sm">
              + Add Facility
            </button>
          </div>

          {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                {error}
              </div>
          )}
          {success && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" /></svg>
                {success}
              </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-fade-in">
            <form onSubmit={(e) => { e.preventDefault(); /* handled by effect */ }} className="flex flex-wrap items-end gap-4">
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                <select
                    value={searchParams.status || ''}
                    onChange={(e) => setSearchParams({...searchParams, status: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors"
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
                <select
                    value={searchParams.locationId || ''}
                    onChange={(e) => setSearchParams({...searchParams, locationId: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors"
                >
                  <option value="">All Locations</option>
                  {availableLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.displayName}</option>
                  ))}
                </select>
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

              {hasActiveFilters && (
                  <button
                      type="button"
                      onClick={resetFilters}
                      className="h-10 px-4 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Reset
                  </button>
              )}
            </form>

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

          {showForm && (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-soft animate-slide-up">
                <h2 className="text-lg font-bold text-campus-900">{editingId ? 'Edit Facility' : 'Add New Facility'}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Name <span className="text-red-400">*</span></label>
                      <input
                          value={form.name}
                          onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormErrors({ ...formErrors, name: undefined }); }}
                          placeholder="e.g. Computer Lab 101"
                          className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${formErrors.name ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 focus:bg-white'}`}
                      />
                      {formErrors.name && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.name}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Location <span className="text-red-400">*</span></label>
                      <select
                          value={form.locationId}
                          onChange={(e) => { setForm({ ...form, locationId: e.target.value === '' ? '' : Number(e.target.value) }); setFormErrors({ ...formErrors, locationId: undefined }); }}
                          className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${formErrors.locationId ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 focus:bg-white'}`}
                      >
                        <option value="">Select a location</option>
                        {availableLocations.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.displayName}</option>
                        ))}
                      </select>
                      {formErrors.locationId && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.locationId}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Type <span className="text-red-400">*</span></label>
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FormState['type'] })} className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors">
                          {TYPES.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Capacity</label>
                        <input
                            type="number"
                            min="1"
                            value={form.capacity}
                            onChange={(e) => { setForm({ ...form, capacity: e.target.value }); setFormErrors({ ...formErrors, capacity: undefined }); }}
                            placeholder="e.g. 30"
                            className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${formErrors.capacity ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 focus:bg-white'}`}
                        />
                        {formErrors.capacity && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.capacity}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Status <span className="text-red-400">*</span></label>
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })} className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors">
                          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      </div>
                      {/* Image Upload/Paste Section moved here */}
                      <div>
                        <label className="text-sm font-semibold text-gray-800 mb-1 block">Facility Image</label>
                        <div className="flex items-center gap-4 mb-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-700">
                            <input 
                              type="radio" 
                              name="imageMode" 
                              className="text-campus-600 focus:ring-campus-500"
                              checked={imageUploadMode === 'upload'}
                              onChange={() => setImageUploadMode('upload')}
                            />
                            Upload file
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-700">
                            <input 
                              type="radio" 
                              name="imageMode" 
                              className="text-campus-600 focus:ring-campus-500"
                              checked={imageUploadMode === 'url'}
                              onChange={() => setImageUploadMode('url')}
                            />
                            Paste URL
                          </label>
                        </div>

                        {imageUploadMode === 'upload' ? (
                          <div className="space-y-2">
                            {editingResource?.imageUrl && !imageFile && (
                              <div className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <img src={editingResource.imageUrl} alt="Current" className="w-8 h-8 object-cover rounded-md border border-gray-100" />
                                <span className="text-[10px] text-gray-500 font-medium">Current image</span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/png, image/jpeg"
                              onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                              className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-white file:text-campus-700 file:border-gray-200 file:border hover:file:bg-gray-50 cursor-pointer"
                            />
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <div className="flex-1">
                              <input
                                type="url"
                                value={pastedImageUrl}
                                onChange={(e) => {
                                  setPastedImageUrl(e.target.value);
                                  setImagePreviewError(false);
                                }}
                                placeholder="https://..."
                                className="w-full h-8 px-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors"
                              />
                            </div>
                            {pastedImageUrl && !imagePreviewError && (
                              <img 
                                src={pastedImageUrl} 
                                alt="Preview" 
                                className="w-8 h-8 object-cover rounded-md border border-gray-200 shrink-0"
                                onError={() => setImagePreviewError(true)}
                              />
                            )}
                            {pastedImageUrl && imagePreviewError && (
                              <div className="w-8 h-8 bg-red-50 rounded-md border border-red-200 flex items-center justify-center shrink-0" title="Invalid image URL">
                                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Schedule */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-gray-800">Weekly Schedule</label>
                      <button 
                        type="button" 
                        onClick={copyToAllWeekdays}
                        className="text-[10px] px-2 py-1 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 hover:text-campus-700 transition-colors shadow-sm"
                        title="Copy Monday's schedule to all weekdays"
                      >
                        Copy Mon to Mon-Fri
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {DAYS.map(day => {
                        const dayData = form.availabilities[day];
                        return (
                          <div key={day} className="flex items-center justify-between gap-3 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                            <label className="flex items-center gap-2 cursor-pointer min-w-[70px]">
                              <input 
                                type="checkbox" 
                                className="rounded text-campus-600 focus:ring-campus-500"
                                checked={dayData?.enabled || false}
                                onChange={(e) => updateAvailability(day, 'enabled', e.target.checked)}
                              />
                              <span className="text-xs font-semibold text-gray-700">{DAY_LABELS[day]}</span>
                            </label>
                            {dayData?.enabled ? (
                              <div className="flex items-center gap-1.5 flex-1">
                                <input 
                                  type="time" 
                                  value={dayData.startTime}
                                  onChange={(e) => updateAvailability(day, 'startTime', e.target.value)}
                                  className="w-full h-8 px-2 text-xs rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-campus-200"
                                  required={dayData.enabled}
                                />
                                <span className="text-gray-400 text-[10px]">to</span>
                                <input 
                                  type="time" 
                                  value={dayData.endTime}
                                  onChange={(e) => updateAvailability(day, 'endTime', e.target.value)}
                                  className="w-full h-8 px-2 text-xs rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-campus-200"
                                  required={dayData.enabled}
                                />
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center justify-center text-[10px] text-gray-400 italic bg-gray-50 rounded h-8 border border-transparent">
                                Closed
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Row: Assets and Amenities */}
                  <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <label className="text-sm font-semibold text-gray-800 mb-3 block">Included Assets</label>
                      {availableAssets.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {availableAssets.map((a) => (
                            <label key={a.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${form.assetIds.includes(a.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                              <input type="checkbox" className="sr-only" checked={form.assetIds.includes(a.id)} onChange={() => toggleAsset(a.id)} />
                              {a.name}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No assets in the catalogue. Add them in Manage Assets first.</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-800 mb-3 block">Included Amenities</label>
                      {availableAmenities.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {availableAmenities.map((a) => (
                            <label key={a.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${form.amenityIds.includes(a.id) ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                              <input type="checkbox" className="sr-only" checked={form.amenityIds.includes(a.id)} onChange={() => toggleAmenity(a.id)} />
                              {a.name}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No amenities in the catalogue. Add them in Manage Amenities first.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="submit" disabled={saving} className="h-11 px-8 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 disabled:opacity-60 transition-colors">
                    {saving ? 'Saving...' : editingId ? 'Update Facility' : 'Create Facility'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); }} className="h-11 px-8 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
          )}

          {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
              </div>
          ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-slide-up">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {['Image', 'Name', 'Type', 'Features', 'Capacity', 'Location', 'Availability', 'Status'].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                    </thead>
                    <tbody>
                    {resources.map((r) => {
                      const rAssets = availableAssets.filter((a) => r.assetIds?.includes(a.id));
                      const rAmenities = availableAmenities.filter((a) => r.amenityIds?.includes(a.id));
                      const chips = [...rAssets, ...rAmenities];
                      const visibleChips = chips.slice(0, 3);
                      const extraCount = chips.length - visibleChips.length;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => handleRowClick(r)}
                          className="border-b border-gray-50 hover:bg-campus-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-4">
                            {r.imageUrl ? (
                              <img src={r.imageUrl} alt={r.name} className="w-10 h-10 object-cover rounded-lg border border-gray-100 shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-[10px] text-gray-400 font-medium border border-gray-100">N/A</div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-campus-800 group-hover:text-campus-900">
                            {r.name}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-600">
                              {typeLabels[r.type] || r.type}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {chips.length === 0 ? (
                              <span className="text-[11px] text-gray-400 italic">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {visibleChips.map((c) => {
                                  const isAsset = rAssets.some((a) => a.id === c.id);
                                  return (
                                    <span
                                      key={`${isAsset ? 'a' : 'm'}-${c.id}`}
                                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${isAsset ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}
                                    >
                                      {c.name}
                                    </span>
                                  );
                                })}
                                {extraCount > 0 && (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-full">
                                    +{extraCount}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {r.capacity ? <span className="font-semibold">{r.capacity} pax</span> : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">{r.locationName || '—'}</td>
                          <td className="px-5 py-4 text-[11px] text-gray-600 whitespace-pre-wrap max-w-[200px]">
                            {formatAvailabilitySummary(r.availabilities)}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${statusStyle[r.status]}`}>
                              {r.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {resources.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-5 py-16 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 mb-1">No facilities found</p>
                              <p className="text-xs text-gray-500">Adjust your search filters or add a new facility.</p>
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
        </div>

        <FacilityDetailModal
          isOpen={!!selectedFacility}
          onClose={() => setSelectedFacility(null)}
          resource={selectedFacility}
          mode="edit"
          onEdit={openEdit}
          onDelete={(r) => { setDeleteConfirm(r); setSelectedFacility(null); }}
          availableAssets={availableAssets}
          availableAmenities={availableAmenities}
        />

        {deleteConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-sm w-full mx-4 animate-slide-up">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-campus-900">Delete Facility</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? All associated bookings and records will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <button
                      onClick={async () => { await handleDelete(deleteConfirm); setDeleteConfirm(null); }}
                      disabled={deleting}
                      className="flex-1 h-11 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                      onClick={() => setDeleteConfirm(null)}
                      disabled={deleting}
                      className="flex-1 h-11 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
        )}
      </AppLayout>
  );
}
