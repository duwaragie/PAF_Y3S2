import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ShuttleMapView from '@/features/shuttle/components/ShuttleMapView';
import { shuttleService, type ShuttleRouteDTO } from '@/services/shuttleService';
import { useShuttleStore } from '@/store/shuttleStore';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FormState = Omit<ShuttleRouteDTO, 'id' | 'createdAt' | 'updatedAt'>;

const emptyForm: FormState = {
  name: '',
  originName: '',
  destinationName: '',
  originLat: 0,
  originLng: 0,
  destLat: 0,
  destLng: 0,
  polyline: '',
  color: '#3b82f6',
  active: true,
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function PolylineGenerator() {
  const routesLib = useMapsLibrary('routes');
  const geometryLib = useMapsLibrary('geometry');
  const [results, setResults] = useState<{name: string, polyline: string}[]>([]);

  useEffect(() => {
    if (!routesLib || !geometryLib) return;

    const directionsService = new routesLib.DirectionsService();
    const locations = [
      { origin: {lat: 6.9100, lng: 79.8500}, dest: {lat: 6.9147, lng: 79.9723}, name: 'Kollupitiya' },
      { origin: {lat: 6.7132, lng: 79.9026}, dest: {lat: 6.9147, lng: 79.9723}, name: 'Panadura' },
      { origin: {lat: 7.2084, lng: 79.8380}, dest: {lat: 6.9147, lng: 79.9723}, name: 'Negombo' }
    ];

    locations.forEach(loc => {
      directionsService.route({
        origin: loc.origin,
        destination: loc.dest,
        travelMode: google.maps.TravelMode.DRIVING
      }, (response, status) => {
        if (status === 'OK' && response) {
          const polyline = response.routes[0].overview_polyline;
          setResults(prev => {
            if (prev.find(r => r.name === loc.name)) return prev;
            return [...prev, { name: loc.name, polyline }];
          });
        }
      });
    });
  }, [routesLib, geometryLib]);

  if (results.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 bg-white p-4 rounded-xl shadow-2xl border border-gray-200 z-[100] w-80 max-h-80 overflow-y-auto">
      <h4 className="text-sm font-bold mb-3 text-campus-900 border-b pb-2">Generated Polylines (Copy these!)</h4>
      <div className="space-y-4">
        {results.map(r => (
          <div key={r.name} className="space-y-1">
            <p className="text-xs font-bold text-campus-600">{r.name}</p>
            <textarea 
              readOnly 
              value={r.polyline} 
              className="w-full h-16 text-[10px] font-mono p-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none" 
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminShuttleRoutesPage() {
  const { routes, setRoutes, isLoading, setLoading, error, setError, selectedRoute, setSelectedRoute } = useShuttleStore();
  
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ShuttleRouteDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Live preview route when editing
  const previewRoutes = showForm ? [
    ...routes.filter(r => r.id !== editingId), // existing other routes
    { ...form, id: editingId || -1 } as ShuttleRouteDTO // the route currently being edited
  ] : routes;

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await shuttleService.getAllRoutes();
        setRoutes(res.data);
      } catch (err) {
        setError('Failed to load shuttle routes.');
      } finally {
        setLoading(false);
      }
    };
    void loadRoutes();
  }, [setLoading, setError, setRoutes]);

  const clearMessages = () => { setError(null); setSuccess(null); };

  const openCreate = () => {
    setForm(emptyForm);
    setFormErrors({});
    setEditingId(null);
    setSelectedRoute(null);
    setShowForm(true);
    clearMessages();
  };

  const openEdit = (r: ShuttleRouteDTO) => {
    setForm({
      name: r.name,
      originName: r.originName,
      destinationName: r.destinationName,
      originLat: r.originLat,
      originLng: r.originLng,
      destLat: r.destLat,
      destLng: r.destLng,
      polyline: r.polyline,
      color: r.color || '#3b82f6',
      active: r.active,
    });
    setFormErrors({});
    setEditingId(r.id);
    setSelectedRoute(r);
    setShowForm(true);
    clearMessages();
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.originName.trim()) errors.originName = 'Origin name is required';
    if (!form.destinationName.trim()) errors.destinationName = 'Destination name is required';
    if (!form.polyline.trim()) errors.polyline = 'Polyline is required';
    
    // Simple coordinate validation
    if (isNaN(form.originLat) || form.originLat < -90 || form.originLat > 90) errors.originLat = 'Invalid latitude';
    if (isNaN(form.originLng) || form.originLng < -180 || form.originLng > 180) errors.originLng = 'Invalid longitude';
    if (isNaN(form.destLat) || form.destLat < -90 || form.destLat > 90) errors.destLat = 'Invalid latitude';
    if (isNaN(form.destLng) || form.destLng < -180 || form.destLng > 180) errors.destLng = 'Invalid longitude';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSaving(true);
      clearMessages();
      
      if (editingId) {
        const res = await shuttleService.updateRoute(editingId, form);
        setRoutes(routes.map((r) => r.id === editingId ? res.data : r));
        setSuccess(`Route "${res.data.name}" updated successfully.`);
      } else {
        const res = await shuttleService.createRoute(form);
        setRoutes([...routes, res.data]);
        setSuccess(`Route "${res.data.name}" created successfully.`);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      setSelectedRoute(null);
    } catch {
      setError(editingId ? 'Failed to update route.' : 'Failed to create route.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      clearMessages();
      const res = await shuttleService.toggleActive(id);
      setRoutes(routes.map(r => r.id === id ? res.data : r));
      setSuccess(`Route ${res.data.active ? 'activated' : 'deactivated'}.`);
    } catch {
      setError('Failed to toggle route status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeleting(true);
      clearMessages();
      await shuttleService.deleteRoute(deleteConfirm.id);
      setRoutes(routes.filter((r) => r.id !== deleteConfirm.id));
      setSuccess(`Route "${deleteConfirm.name}" has been deleted.`);
      setDeleteConfirm(null);
      if (selectedRoute?.id === deleteConfirm.id) setSelectedRoute(null);
    } catch {
      setError('Failed to delete route.');
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">Manage Shuttle Routes</h1>
            <p className="text-sm text-gray-500 mt-1">Configure campus shuttle routes, waypoints, and active status.</p>
          </div>
          <button onClick={openCreate} className="shrink-0 h-10 px-5 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 transition-colors shadow-sm">
            + Add Route
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

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-sm w-full mx-4 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-campus-900">Delete Route</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
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

        {/* Split Layout: List/Form on Left, Map on Right */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Column */}
          <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col gap-6">
            
            {showForm ? (
              // Edit/Create Modal (rendered inline here)
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-soft animate-slide-up">
                <h2 className="text-lg font-bold text-campus-900">{editingId ? 'Edit Route' : 'Add New Route'}</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Route Name <span className="text-red-400">*</span></label>
                    <input
                      value={form.name}
                      onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormErrors({ ...formErrors, name: undefined }); }}
                      placeholder="e.g. Kollupitiya - Malabe Express"
                      className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${formErrors.name ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 focus:bg-white'}`}
                    />
                    {formErrors.name && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.name}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Origin Name <span className="text-red-400">*</span></label>
                      <input
                        value={form.originName}
                        onChange={(e) => { setForm({ ...form, originName: e.target.value }); setFormErrors({ ...formErrors, originName: undefined }); }}
                        placeholder="e.g. Kollupitiya"
                        className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${formErrors.originName ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 focus:bg-white'}`}
                      />
                      {formErrors.originName && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.originName}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Destination Name <span className="text-red-400">*</span></label>
                      <input
                        value={form.destinationName}
                        onChange={(e) => { setForm({ ...form, destinationName: e.target.value }); setFormErrors({ ...formErrors, destinationName: undefined }); }}
                        placeholder="e.g. Malabe Campus"
                        className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${formErrors.destinationName ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 focus:bg-white'}`}
                      />
                      {formErrors.destinationName && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.destinationName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase">Origin Coords</p>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Latitude</label>
                        <input type="number" step="any" value={form.originLat} onChange={(e) => { setForm({ ...form, originLat: parseFloat(e.target.value) }); setFormErrors({ ...formErrors, originLat: undefined }); }} className={`w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 ${formErrors.originLat ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'}`} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Longitude</label>
                        <input type="number" step="any" value={form.originLng} onChange={(e) => { setForm({ ...form, originLng: parseFloat(e.target.value) }); setFormErrors({ ...formErrors, originLng: undefined }); }} className={`w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 ${formErrors.originLng ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'}`} />
                      </div>
                    </div>
                    <div className="space-y-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase">Dest Coords</p>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Latitude</label>
                        <input type="number" step="any" value={form.destLat} onChange={(e) => { setForm({ ...form, destLat: parseFloat(e.target.value) }); setFormErrors({ ...formErrors, destLat: undefined }); }} className={`w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 ${formErrors.destLat ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'}`} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Longitude</label>
                        <input type="number" step="any" value={form.destLng} onChange={(e) => { setForm({ ...form, destLng: parseFloat(e.target.value) }); setFormErrors({ ...formErrors, destLng: undefined }); }} className={`w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 ${formErrors.destLng ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'}`} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Encoded Polyline <span className="text-red-400">*</span></label>
                    <textarea
                      value={form.polyline}
                      onChange={(e) => { setForm({ ...form, polyline: e.target.value }); setFormErrors({ ...formErrors, polyline: undefined }); }}
                      placeholder="Paste Google Directions encoded polyline..."
                      rows={3}
                      className={`w-full p-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors resize-none ${formErrors.polyline ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 focus:bg-white'}`}
                    />
                    {formErrors.polyline && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.polyline}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">Copy the text from the generator on the map and paste here.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Route Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={form.color}
                          onChange={(e) => setForm({ ...form, color: e.target.value })}
                          className="h-11 w-11 p-1 rounded border border-gray-200 cursor-pointer"
                        />
                        <span className="text-sm font-mono text-gray-500">{form.color}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.active}
                          onChange={(e) => setForm({ ...form, active: e.target.checked })}
                          className="w-5 h-5 rounded text-campus-600 focus:ring-campus-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-800">Active Route</span>
                      </label>
                    </div>
                  </div>

                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="submit" disabled={saving} className="flex-1 h-11 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 disabled:opacity-60 transition-colors">
                    {saving ? 'Saving...' : editingId ? 'Update Route' : 'Create Route'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); }} className="flex-1 h-11 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              // List View
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-b border-gray-100 hover:bg-transparent">
                          <TableHead className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Route</TableHead>
                          <TableHead className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</TableHead>
                          <TableHead className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routes.map((r) => (
                          <TableRow 
                            key={r.id} 
                            onClick={() => setSelectedRoute(r)}
                            className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group ${selectedRoute?.id === r.id ? 'bg-campus-50/30' : ''}`}
                          >
                            <TableCell className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color || '#ccc' }} />
                                <div>
                                  <p className="text-sm font-bold text-campus-900 group-hover:text-campus-700 transition-colors">{r.name}</p>
                                  <p className="text-[11px] text-gray-500 mt-0.5">{r.originName} → {r.destinationName}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-4 text-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); void handleToggleActive(r.id); }}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider transition-colors ${r.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                title="Click to toggle status"
                              >
                                {r.active ? 'ACTIVE' : 'INACTIVE'}
                              </button>
                            </TableCell>
                            <TableCell className="px-5 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1.5 text-campus-600 hover:bg-campus-50 rounded transition-colors" title="Edit">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(r); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {routes.length === 0 && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={3} className="px-5 py-12 text-center">
                              <p className="text-sm font-semibold text-gray-900 mb-1">No routes found</p>
                              <p className="text-xs text-gray-500">Create your first shuttle route.</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Map Preview */}
          <div className="w-full lg:w-1/2 xl:w-3/5 min-h-[400px] lg:min-h-[600px] sticky top-24 relative">
            <ShuttleMapView 
              routes={previewRoutes} 
              selectedRouteId={showForm ? (editingId || null) : selectedRoute?.id} 
              interactive={true}
              onRouteClick={(route) => {
                if (!showForm) setSelectedRoute(route);
              }}
            />
            {/* The PolylineGenerator displays the routes directly on the screen */}
            <PolylineGenerator />
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
