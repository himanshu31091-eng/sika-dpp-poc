import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

const API = axios.create({ baseURL: API_URL });

export const publicApi = {
  search: (q: string) => API.get(`/docs?q=${encodeURIComponent(q)}`),
  getLatest: (slug: string) => API.get(`/docs/${slug}/latest`),
  getVersion: (slug: string, version: string) => API.get(`/docs/${slug}/v/${version}`),
  getVersionList: (slug: string) => API.get(`/docs/${slug}/versions`),
  getDownloadUrl: (slug: string, version: string) =>
    `${API_URL}/docs/${slug}/v/${version}/download`,
};

export const adminApi = {
  upload: (formData: FormData) =>
    API.post('/admin/documents', formData, {
      headers: { 'x-api-key': ADMIN_KEY, 'Content-Type': 'multipart/form-data' },
    }),
  addVersion: (slug: string, formData: FormData) =>
    API.patch(`/admin/documents/${slug}/versions`, formData, {
      headers: { 'x-api-key': ADMIN_KEY, 'Content-Type': 'multipart/form-data' },
    }),
  publish: (slug: string) =>
    API.patch(`/admin/documents/${slug}/publish`, {}, {
      headers: { 'x-api-key': ADMIN_KEY },
    }),
  archive: (slug: string) =>
    API.patch(`/admin/documents/${slug}/archive`, {}, {
      headers: { 'x-api-key': ADMIN_KEY },
    }),
  listAll: () =>
    API.get('/admin/documents', { headers: { 'x-api-key': ADMIN_KEY } }),
  getOne: (slug: string) =>
    API.get(`/admin/documents/${slug}`, { headers: { 'x-api-key': ADMIN_KEY } }),
};

