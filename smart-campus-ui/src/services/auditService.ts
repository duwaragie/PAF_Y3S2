import { api } from '@/lib/axios';

export interface AuditLogEntry {
  id: number;
  actorId: number | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditPage {
  items: AuditLogEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuditFilters {
  actor?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export const auditService = {
  list: (filters: AuditFilters) =>
    api.get<AuditPage>('/admin/audit', { params: filters }),
  actions: () => api.get<string[]>('/admin/audit/actions'),
  actors: () => api.get<string[]>('/admin/audit/actors'),
  downloadCsv: async (filters: Omit<AuditFilters, 'page' | 'size'>) => {
    const res = await api.get('/admin/audit/export', { params: filters, responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
    link.download = `audit-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
