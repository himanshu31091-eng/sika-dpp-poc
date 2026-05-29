import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

const API = axios.create({ baseURL: API_URL });

const adminHeaders = () => ({
  'x-api-key': ADMIN_KEY,
  'x-admin-user': typeof window !== 'undefined' ? (localStorage.getItem('admin_user') || 'unknown') : 'unknown',
});

export const publicApi = {
  search: (q: string) => API.get(`/docs?q=${encodeURIComponent(q)}`),
  getLatest: (slug: string) => API.get(`/docs/${slug}/latest`),
  getVersion: (slug: string, version: string) => API.get(`/docs/${slug}/v/${version}`),
  getVersionList: (slug: string) => API.get(`/docs/${slug}/versions`),
  getDownloadUrl: (slug: string, version: string) =>
    `${API_URL}/docs/${slug}/v/${version}/download`,
  trackView: (slug: string, version?: string) =>
    API.post(`/docs/${slug}/view`, { version }).catch(() => {}),
};

export const adminApi = {
  upload: (formData: FormData) =>
    API.post('/admin/documents', formData, {
      headers: { ...adminHeaders(), 'Content-Type': 'multipart/form-data' },
    }),
  addVersion: (slug: string, formData: FormData) =>
    API.patch(`/admin/documents/${slug}/versions`, formData, {
      headers: { ...adminHeaders(), 'Content-Type': 'multipart/form-data' },
    }),
  publish: (slug: string) =>
    API.patch(`/admin/documents/${slug}/publish`, {}, { headers: adminHeaders() }),
  archive: (slug: string) =>
    API.patch(`/admin/documents/${slug}/archive`, {}, { headers: adminHeaders() }),
  listAll: () =>
    API.get('/admin/documents', { headers: adminHeaders() }),
  getOne: (slug: string) =>
    API.get(`/admin/documents/${slug}`, { headers: adminHeaders() }),
  getAudit: (limit = 50) =>
    API.get(`/admin/audit?limit=${limit}`, { headers: adminHeaders() }),
  getAnalytics: () =>
    API.get('/admin/analytics', { headers: adminHeaders() }),
};
