import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { resourceService, type ResourceDTO, type ResourceSearchParams } from '@/services/resourceService';
import { assetService, type AssetDTO } from '@/services/assetService';
import { amenityService, type AmenityDTO } from '@/services/amenityService';
import { storageService } from '@/services/storageService';
import { FacilityDetailModal } from '@/features/facilities/components/FacilityDetailModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'] as const;
const STATUSES = ['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'] as const;

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
  location: string;
  availabilityWindows: string;
  status: ResourceDTO['status'];
  assetIds: number[];
  amenityIds: number[];
};

const emptyForm: FormState = {
  name: '',
  type: 'LAB',
  capacity: '',
  location: '',
  availabilityWindows: '',
  status: 'ACTIVE',
  assetIds: [],
  amenityIds: [],
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function FacilitiesPage() {
  const [resources, setResources] = useState<ResourceDTO[]>([]);
  const [availableAssets, setAvailableAssets] = useState<AssetDTO[]>([]);
  const [availableAmenities, setAvailableAmenities] = useState<AmenityDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useState<ResourceSearchParams>({});

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ResourceDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal State
  const [selectedFacility, setSelectedFacility] = useState<ResourceDTO | null>(null);

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
            Object.entries(searchParams).filter(([, v]) => v !== '' && v != null)
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
        // non-blocking — form still works without catalogues
      }
    };
    void loadCatalogues();
  }, []);

  const resetFilters = () => setSearchParams({});

  const clearMessages = () => { setError(null); setSuccess(null); };

  const openCreate = () => {
    setForm(emptyForm);
    setFormErrors({});
    setEditingId(null);
    setImageFile(null);
    setPastedImageUrl('');
    setImageUploadMode('upload');
    setImagePreviewError(false);
    setShowForm(true);
    setSelectedFacility(null); // Close modal if open
    clearMessages();
  };

  const openEdit = (r: ResourceDTO) => {
    setForm({
      name: r.name,
      type: r.type,
      capacity: r.capacity?.toString() || '',
      location: r.location || '',
      availabilityWindows: r.availabilityWindows || '',
      status: r.status,
      assetIds: r.assetIds || [],
      amenityIds: r.amenityIds || [],
    });
    setFormErrors({});
    setEditingId(r.id);
    
    // Set up image state based on existing URL
    setImageFile(null);
    setImagePreviewError(false);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    if (r.imageUrl && supabaseUrl && !r.imageUrl.startsWith(supabaseUrl)) {
      setImageUploadMode('url');
      setPastedImageUrl(r.imageUrl);
    } else {
      setImageUploadMode('upload');
      setPastedImageUrl('');
    }

    setShowForm(true);
    setSelectedFacility(null); // Close modal to show form
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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.location.trim()) errors.location = 'Location is required';
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

      const payload = {
        name: form.name.trim(),
        type: form.type,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        location: form.location.trim(),
        availabilityWindows: form.availabilityWindows.trim(),
        status: form.status,
        assetIds: form.assetIds,
        amenityIds: form.amenityIds,
        imageUrl: finalImageUrl,
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

              {Object.values(searchParams).some((v) => v !== '' && v != null) && (
                  <button
                      type="button"
                      onClick={resetFilters}
                      className="h-10 px-4 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Reset
                  </button>
              )}
            </form>
          </div>

          {showForm && (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-soft animate-slide-up">
                <h2 className="text-lg font-bold text-campus-900">{editingId ? 'Edit Facility' : 'Add New Facility'}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Location <span className="text-red-400">*</span></label>
                      <input
                          value={form.location}
                          onChange={(e) => { setForm({ ...form, location: e.target.value }); setFormErrors({ ...formErrors, location: undefined }); }}
                          placeholder="e.g. Block A, Floor 1"
                          className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${formErrors.location ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 focus:bg-white'}`}
                      />
                      {formErrors.location && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.location}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Availability Windows</label>
                      <input
                          value={form.availabilityWindows}
                          onChange={(e) => setForm({ ...form, availabilityWindows: e.target.value })}
                          placeholder="e.g. Mon-Fri 08:00-18:00"
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Status <span className="text-red-400">*</span></label>
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })} className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors">
                          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Assets, Amenities, and Image Upload */}
                  <div className="space-y-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    
                    {/* Image Upload/Paste Section */}
                    <div>
                      <label className="text-sm font-semibold text-gray-800 mb-3 block">Facility Image</label>
                      <div className="flex items-center gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                          <input 
                            type="radio" 
                            name="imageMode" 
                            className="text-campus-600 focus:ring-campus-500"
                            checked={imageUploadMode === 'upload'}
                            onChange={() => setImageUploadMode('upload')}
                          />
                          Upload file
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                          <input 
                            type="radio" 
                            name="imageMode" 
                            className="text-campus-600 focus:ring-campus-500"
                            checked={imageUploadMode === 'url'}
                            onChange={() => setImageUploadMode('url')}
                          />
                          Paste image URL
                        </label>
                      </div>

                      {imageUploadMode === 'upload' ? (
                        <input
                          type="file"
                          accept="image/png, image/jpeg"
                          onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                          className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white file:text-campus-700 file:border-gray-200 file:border hover:file:bg-gray-50 cursor-pointer"
                        />
                      ) : (
                        <div className="flex gap-3 items-center">
                          <div className="flex-1">
                            <input
                              type="url"
                              value={pastedImageUrl}
                              onChange={(e) => {
                                setPastedImageUrl(e.target.value);
                                setImagePreviewError(false);
                              }}
                              placeholder="https://example.com/image.jpg"
                              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors"
                            />
                          </div>
                          {pastedImageUrl && !imagePreviewError && (
                            <img 
                              src={pastedImageUrl} 
                              alt="Preview" 
                              className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
                              onError={() => setImagePreviewError(true)}
                            />
                          )}
                          {pastedImageUrl && imagePreviewError && (
                            <div className="w-10 h-10 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center shrink-0" title="Invalid image URL">
                              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <hr className="border-gray-200" />

                    <div>
                      <label className="text-sm font-semibold text-gray-800 mb-3 block">Included Assets</label>
                      {availableAssets.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {availableAssets.map((a) => (
                            <label key={a.id} className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200">
                              <input type="checkbox" className="mt-1 rounded text-campus-600 focus:ring-campus-500" checked={form.assetIds.includes(a.id)} onChange={() => toggleAsset(a.id)} />
                              <div>
                                <p className="text-sm font-medium text-gray-700">{a.name}</p>
                                {a.description && <p className="text-[10px] text-gray-400 truncate w-32" title={a.description}>{a.description}</p>}
                              </div>
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
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {availableAmenities.map((a) => (
                            <label key={a.id} className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200">
                              <input type="checkbox" className="mt-1 rounded text-campus-600 focus:ring-campus-500" checked={form.amenityIds.includes(a.id)} onChange={() => toggleAmenity(a.id)} />
                              <div>
                                <p className="text-sm font-medium text-gray-700">{a.name}</p>
                                {a.description && <p className="text-[10px] text-gray-400 truncate w-32" title={a.description}>{a.description}</p>}
                              </div>
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
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {['Name', 'Type', 'Features', 'Capacity', 'Location', 'Availability', 'Status'].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                    </thead>
                    <tbody>
                    {resources.map((r) => (
                        <tr 
                          key={r.id} 
                          onClick={() => handleRowClick(r)}
                          className="border-b border-gray-50 hover:bg-campus-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-4 text-sm font-semibold text-campus-800 group-hover:text-campus-900">
                            {r.name}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-600">
                              {typeLabels[r.type] || r.type}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                              {r.assetIds && r.assetIds.length > 0 && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">{r.assetIds.length} Assets</span>
                              )}
                              {r.amenityIds && r.amenityIds.length > 0 && (
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded">{r.amenityIds.length} Amenities</span>
                              )}
                              {(!r.assetIds?.length && !r.amenityIds?.length) && (
                                <span className="text-[11px] text-gray-400 italic">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {r.capacity ? <span className="font-semibold">{r.capacity} pax</span> : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">{r.location || '—'}</td>
                          <td className="px-5 py-4 text-sm text-gray-500">{r.availabilityWindows || '—'}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${statusStyle[r.status]}`}>
                              {r.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                    ))}
                    {resources.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-16 text-center">
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
      </AppLayout>
  );
}
