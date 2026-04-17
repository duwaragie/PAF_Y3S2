import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { assetService, type AssetDTO } from '@/services/assetService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FormState = { 
  name: string; 
  description: string;
};

const emptyForm: FormState = { 
  name: '', 
  description: ''
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function AssetsAdminPage() {
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<AssetDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await assetService.getAll();
      setAssets(res.data);
    } catch {
      setError('Failed to load assets.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => { setError(null); setSuccess(null); };

  const openCreate = () => {
    setForm(emptyForm);
    setFormErrors({});
    setEditingId(null);
    setShowForm(true);
    clearMessages();
  };

  const openEdit = (a: AssetDTO) => {
    setForm({
      name: a.name,
      description: a.description || '',
    });
    setFormErrors({});
    setEditingId(a.id);
    setShowForm(true);
    clearMessages();
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSaving(true);
      clearMessages();

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if (editingId) {
        const res = await assetService.update(editingId, payload);
        setAssets((prev) => prev.map((a) => a.id === editingId ? res.data : a));
        setSuccess(`"${res.data.name}" updated successfully.`);
      } else {
        const res = await assetService.create(payload);
        setAssets((prev) => [...prev, res.data]);
        setSuccess(`"${res.data.name}" created successfully.`);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch {
      setError(editingId ? 'Failed to update asset.' : 'Failed to create asset.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeleting(true);
      clearMessages();

      await assetService.delete(deleteConfirm.id);
      
      setAssets((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
      setSuccess(`"${deleteConfirm.name}" has been deleted.`);
      setDeleteConfirm(null);
    } catch {
      setError('Failed to delete asset.');
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
            <h1 className="text-2xl font-bold text-campus-900">Manage Assets</h1>
            <p className="text-sm text-gray-500 mt-1">Configure individual assets (e.g. Projectors, Monitors) that can be assigned to facilities.</p>
          </div>
          <button onClick={openCreate} className="shrink-0 h-10 px-5 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 transition-colors shadow-sm">
            + Add Asset
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
                  <h3 className="text-base font-bold text-campus-900">Delete Asset</h3>
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

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-soft animate-slide-up">
            <h2 className="text-lg font-bold text-campus-900">{editingId ? 'Edit Asset' : 'Add New Asset'}</h2>
            
            <div className="grid grid-cols-1 gap-4 max-w-xl">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Asset Name <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormErrors({ ...formErrors, name: undefined }); }}
                  placeholder="e.g. 4K Projector"
                  className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors ${formErrors.name ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 focus:bg-white'}`}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.name}</p>}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => { setForm({ ...form, description: e.target.value }); }}
                  placeholder="e.g. High resolution projector for main hall"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campus-200 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 max-w-xl">
              <button type="submit" disabled={saving} className="h-11 px-8 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 disabled:opacity-60 transition-colors">
                {saving ? 'Saving...' : editingId ? 'Update Asset' : 'Create Asset'}
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-slide-up">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50 rounded-t-2xl">
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    {['Name', 'Description', 'Actions'].map((h) => (
                      <TableHead key={h} className={`px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider h-auto ${h === 'Actions' ? 'text-right' : ''}`}>
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((a) => (
                    <TableRow key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <TableCell className="px-5 py-4 text-sm font-semibold text-campus-800 w-1/4">{a.name}</TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600">{a.description || <span className="text-gray-400 italic">No description</span>}</TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        <div className="flex gap-3 justify-end">
                          <button onClick={() => openEdit(a)} className="text-sm font-semibold text-campus-600 hover:text-campus-800 transition-colors">Edit</button>
                          <button onClick={() => setDeleteConfirm(a)} className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors">Delete</button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {assets.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={3} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">No assets found</p>
                          <p className="text-xs text-gray-500">Create your first asset to assign it to facilities.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {assets.length > 0 && (
              <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider rounded-b-2xl">
                Showing {assets.length} asset{assets.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
