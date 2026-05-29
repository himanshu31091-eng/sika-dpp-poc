'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';

const DOC_TYPES = ['DoPC', 'SDS', 'TDS', 'Label', 'Technical', 'Other'];
const LANGUAGES = ['EN', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'PT', 'Other'];
type Mode = 'dashboard' | 'new' | 'version' | 'list' | 'edms';

interface DocItem {
  slug: string; productCode: string; productName: string;
  status: string; versions: { versionNumber: string }[]; updatedAt: string;
}

const SC: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  draft:     'bg-amber-50 text-amber-700 border border-amber-200',
  archived:  'bg-gray-50 text-gray-500 border border-gray-200',
};
const SC_DARK: Record<string, string> = {
  published: 'dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  draft:     'dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  archived:  'dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [mode, setMode] = useState<Mode>('new');
  const [dark, setDark] = useState(false);

  // Dashboard state
  const [dashboardDocs, setDashboardDocs] = useState<DocItem[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<{ totalViews: number; totalDownloads: number; byDocument: any[] } | null>(null);

  // All documents state
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [listStatus, setListStatus] = useState('all');
  const [listView, setListView] = useState<'list' | 'grid'>('list');

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef({
    slug: '', productCode: '', productName: '', versionNumber: '1.0',
    title: '', language: 'EN', documentType: 'TDS', productCategory: '',
    edmsDocId: '', status: 'draft',
  });

  // EDMS demo state
  const [edmsResult, setEdmsResult] = useState<any>(null);
  const [edmsLoading, setEdmsLoading] = useState(false);
  const [edmsFile, setEdmsFile] = useState<File | null>(null);
  const edmsFileRef = useRef<HTMLInputElement>(null);
  const edmsFormRef = useRef({
    edmsDocId: 'EDMS-2026-001', edmsVersionId: 'v1',
    slug: 'sikadur-32--tds-en', productCode: 'Sikadur-32',
    productName: 'Sikadur-32 Normal Epoxy Adhesive', versionNumber: '1.0',
    documentType: 'TDS', language: 'EN', productCategory: 'Concrete',
    title: 'Technical Data Sheet -- Sikadur-32',
  });

  // Dark mode: persist to localStorage, apply class to <html>
  useEffect(() => {
    const saved = localStorage.getItem('admin_theme');
    const isDark = saved === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('admin_theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    const user = localStorage.getItem('admin_user') || '';
    if (!auth) { router.replace('/admin/login'); }
    else { setCurrentUser(user); setAuthChecked(true); setMode('dashboard'); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('admin_user');
    router.replace('/admin/login');
  };

  const loadDocs = useCallback(async () => {
    setDocsLoading(true);
    try { const { data } = await adminApi.listAll(); setDocs(data); }
    catch (e) { console.error(e); }
    finally { setDocsLoading(false); }
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const [docsRes, auditRes, analyticsRes] = await Promise.allSettled([
        adminApi.listAll(), adminApi.getAudit(20), adminApi.getAnalytics(),
      ]);
      if (docsRes.status === 'fulfilled') setDashboardDocs(docsRes.value.data);
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value.data);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
    } catch (e) { console.error(e); }
    finally { setDashboardLoading(false); }
  }, []);

  useEffect(() => { if (mode === 'list') loadDocs(); }, [mode, loadDocs]);
  useEffect(() => { if (mode === 'dashboard') loadDashboard(); }, [mode, loadDashboard]);

  // Filtered docs for All Documents tab
  const filteredDocs = useMemo(() => docs.filter(d => {
    if (listStatus !== 'all' && d.status !== listStatus) return false;
    if (listSearch) {
      const q = listSearch.toLowerCase();
      return d.productName.toLowerCase().includes(q) || d.productCode.toLowerCase().includes(q) || d.slug.includes(q);
    }
    return true;
  }), [docs, listSearch, listStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please select a PDF file');
    setLoading(true); setResult(null);
    try {
      const fd = new FormData();
      const f = formRef.current;
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      fd.append('file', file);
      const { data } = mode === 'new' ? await adminApi.upload(fd) : await adminApi.addVersion(f.slug, fd);
      setResult({ success: true, ...data });
      if (mode === 'new') { formRef.current.slug = ''; formRef.current.productCode = ''; formRef.current.productName = ''; formRef.current.edmsDocId = ''; }
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) { setResult({ error: err.response?.data?.error || err.message }); }
    finally { setLoading(false); }
  };

  const handlePublish = async (slug: string) => { try { await adminApi.publish(slug); loadDocs(); } catch { alert('Failed'); } };
  const handleArchive = async (slug: string) => {
    if (!confirm('Archive ' + slug + '?')) return;
    try { await adminApi.archive(slug); loadDocs(); } catch { alert('Failed'); }
  };

  const handleEdmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edmsFile) return alert('Please select a PDF file');
    setEdmsLoading(true); setEdmsResult(null);
    try {
      const f = edmsFormRef.current;
      const { data: pushData } = await adminApi.edmsPush({ edmsDocId: f.edmsDocId, edmsVersionId: f.edmsVersionId, slug: f.slug, productCode: f.productCode, productName: f.productName, versionNumber: f.versionNumber, documentType: f.documentType, language: f.language, title: f.title });
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      fd.append('file', edmsFile);
      const { data: uploadData } = pushData.action === 'create_pending' ? await adminApi.upload(fd) : await adminApi.addVersion(f.slug, fd);
      await adminApi.publish(f.slug);
      setEdmsResult({ success: true, push: pushData, upload: uploadData });
      setEdmsFile(null);
      if (edmsFileRef.current) edmsFileRef.current.value = '';
    } catch (err: any) { setEdmsResult({ error: err.response?.data?.error || err.message }); }
    finally { setEdmsLoading(false); }
  };

  const F = ({ label, field, placeholder }: { label: string; field: keyof typeof formRef.current; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <input type="text" defaultValue={formRef.current[field]} placeholder={placeholder}
        onChange={e => { formRef.current[field] = e.target.value as any; }}
        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sika-red focus:outline-none transition-colors" />
    </div>
  );

  const S = ({ label, field, options }: { label: string; field: keyof typeof formRef.current; options: string[] }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <select defaultValue={formRef.current[field]} onChange={e => { formRef.current[field] = e.target.value as any; }}
        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sika-red focus:outline-none transition-colors">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  if (!authChecked) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-10 h-10 border-2 border-sika-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading admin panel…</p>
      </div>
    </div>
  );

  const statusBadge = (status: string) =>
    `${SC[status] || SC.draft} ${SC_DARK[status] || SC_DARK.draft}`;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">

      {/* ── Header ── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-sika-red rounded-lg flex items-center justify-center shadow-red-sm shrink-0">
              <span className="text-white text-sm font-bold leading-none">S</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">Admin Panel</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">Document management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/how-it-works" className="hidden sm:flex text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200">
              How It Works
            </a>
            <a href="/" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200">
              ← Site
            </a>
            {/* Dark mode toggle */}
            <button onClick={toggleDark}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm">
              {dark ? '☀' : '☾'}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-lg">
                <div className="w-5 h-5 bg-sika-red rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold leading-none">{currentUser[0]?.toUpperCase()}</span>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 hidden sm:block">{currentUser}</span>
              </div>
              <button onClick={handleLogout}
                className="text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-all duration-200">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Tab bar ── */}
        <div className="flex bg-gray-100 dark:bg-gray-800/80 rounded-xl p-1 mb-8 gap-0.5 overflow-x-auto w-full sm:w-fit">
          {(['dashboard', 'new', 'version', 'list', 'edms'] as Mode[]).map(k => (
            <button key={k} onClick={() => setMode(k as Mode)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 btn-press whitespace-nowrap ${
                mode === k
                  ? 'bg-white dark:bg-gray-700 shadow-card text-gray-900 dark:text-white scale-[1.02]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/50'
              }`}>
              {k === 'dashboard' ? '◈ Dashboard' : k === 'new' ? '+ New document' : k === 'version' ? '↑ Add version' : k === 'list' ? '☰ All documents' : '⇄ EDMS Demo'}
            </button>
          ))}
        </div>

        {/* ── Dashboard ── */}
        {mode === 'dashboard' && (() => {
          const total = dashboardDocs.length;
          const published = dashboardDocs.filter(d => d.status === 'published').length;
          const drafts = dashboardDocs.filter(d => d.status === 'draft');
          const archived = dashboardDocs.filter(d => d.status === 'archived').length;
          const recent = [...dashboardDocs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8);
          return (
            <div className="space-y-5">
              {dashboardLoading ? (
                <div className="py-16 text-center animate-fade-in">
                  <div className="w-8 h-8 border-2 border-sika-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Loading dashboard…</p>
                </div>
              ) : (
                <>
                  {/* Stat cards */}
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 animate-slide-up">
                    {[
                      { label: 'Total',     value: total,                          bg: 'from-slate-800 to-slate-700' },
                      { label: 'Published', value: published,                      bg: 'from-emerald-600 to-emerald-500' },
                      { label: 'Drafts',    value: drafts.length,                  bg: 'from-amber-500 to-amber-400' },
                      { label: 'Archived',  value: archived,                       bg: 'from-gray-500 to-gray-400' },
                      { label: 'Views',     value: analytics?.totalViews ?? '—',   bg: 'from-violet-600 to-violet-500' },
                      { label: 'Downloads', value: analytics?.totalDownloads ?? '—', bg: 'from-indigo-600 to-indigo-500' },
                    ].map(c => (
                      <div key={c.label} className={`rounded-xl p-4 sm:p-5 bg-gradient-to-br ${c.bg} shadow-card-md`}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">{c.label}</p>
                        <p className="text-3xl font-bold text-white leading-none">{c.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Drafts pending — full width if any */}
                  {drafts.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900 rounded-xl p-5 shadow-card animate-slide-up">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">{drafts.length}</span>
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Drafts pending publish</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {drafts.map(doc => (
                          <div key={doc.slug} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{doc.productName}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{doc.productCode}</p>
                            </div>
                            <button onClick={async () => { try { await adminApi.publish(doc.slug); loadDashboard(); } catch { alert('Failed'); } }}
                              className="btn-press text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-semibold shrink-0 transition-colors duration-200">
                              Publish
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Middle row: top docs + recently updated */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {analytics && analytics.byDocument.length > 0 && (
                      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-card">
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Top by activity</h2>
                        <div className="space-y-3">
                          {analytics.byDocument.slice(0, 6).map((item: any, i: number) => {
                            const tot = item.views + item.downloads;
                            const mx = analytics.byDocument[0].views + analytics.byDocument[0].downloads || 1;
                            return (
                              <div key={item.slug}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs text-gray-300 dark:text-gray-600 w-4 shrink-0">{i+1}</span>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate font-medium">{item.slug}</p>
                                  </div>
                                  <div className="flex gap-2 shrink-0 text-xs ml-2">
                                    <span className="text-violet-600 dark:text-violet-400 font-medium">{item.views}v</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">{item.downloads}d</span>
                                  </div>
                                </div>
                                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
                                    style={{ width: `${(tot / mx) * 100}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-card">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Recently updated</h2>
                        <button onClick={loadDashboard} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">↺ Refresh</button>
                      </div>
                      {recent.length === 0 ? (
                        <p className="text-sm text-gray-400 py-6 text-center">No documents yet</p>
                      ) : (
                        <div className="space-y-0.5">
                          {recent.map(doc => (
                            <div key={doc.slug} className="flex items-center justify-between gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{doc.productName}</p>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">{doc.productCode}</p>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusBadge(doc.status)}`}>{doc.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audit log — full width */}
                  {auditLogs.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-card">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Audit log</h2>
                        <button onClick={() => {
                          const header = 'Timestamp,Action,Slug,Version,Performed By,IP\n';
                          const rows = auditLogs.map((l: any) => [new Date(l.timestamp).toISOString(), l.action, l.slug, l.version || '', l.performedBy, l.ip || ''].join(',')).join('\n');
                          const blob = new Blob([header + rows], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`;
                          a.click(); URL.revokeObjectURL(url);
                        }} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors duration-200">
                          Export CSV
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                        {auditLogs.map((log: any, i: number) => {
                          const styles: Record<string, string> = { publish: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', archive: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', create: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', add_version: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' };
                          const icons: Record<string, string> = { publish: '✓', archive: '⊘', create: '+', add_version: '↑' };
                          return (
                            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                              <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${styles[log.action] || 'bg-gray-100 text-gray-500'}`}>
                                {icons[log.action] || '?'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{log.action.replace('_', ' ')}</span>
                                  <span className="text-xs text-gray-300 dark:text-gray-600 shrink-0">{new Date(log.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                  <span className="font-mono">{log.slug}</span>
                                  {log.version && <span> · v{log.version}</span>}
                                  <span> · {log.performedBy}</span>
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* ── All Documents ── */}
        {mode === 'list' && (
          <div className="space-y-4 animate-slide-up">
            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-card">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                  <input
                    type="text"
                    value={listSearch}
                    onChange={e => setListSearch(e.target.value)}
                    placeholder="Search by name, code or slug…"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-sika-red focus:outline-none transition-colors placeholder-gray-400"
                  />
                  {listSearch && (
                    <button onClick={() => setListSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs">✕</button>
                  )}
                </div>
                {/* Status filter */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  {['all', 'published', 'draft', 'archived'].map(s => (
                    <button key={s} onClick={() => setListStatus(s)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all duration-200 ${
                        listStatus === s
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}>
                      {s === 'all' ? 'All' : s}
                    </button>
                  ))}
                </div>
                {/* View toggle */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shrink-0">
                  {(['list', 'grid'] as const).map(v => (
                    <button key={v} onClick={() => setListView(v)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                        listView === v
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}>
                      {v === 'list' ? '☰' : '⊞'}
                    </button>
                  ))}
                </div>
                <button onClick={loadDocs} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-200 shrink-0">
                  ↺
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {docsLoading ? 'Loading…' : `${filteredDocs.length} of ${docs.length} documents`}
                  {listSearch && ` matching "${listSearch}"`}
                </p>
              </div>
            </div>

            {/* Results */}
            {docsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">No documents found</p>
                <p className="text-sm text-gray-400 mt-1">{listSearch ? `No results for "${listSearch}"` : 'No documents match the selected filter'}</p>
                <button onClick={() => { setListSearch(''); setListStatus('all'); }} className="mt-3 text-sm text-sika-red underline">Clear filters</button>
              </div>
            ) : listView === 'list' ? (
              /* List view */
              <div className="space-y-2">
                {filteredDocs.map(doc => (
                  <div key={doc.slug} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-card card-hover">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded font-semibold">{doc.productCode}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusBadge(doc.status)}`}>{doc.status}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{doc.versions?.length} version(s)</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{doc.productName}</p>
                        <code className="text-xs text-blue-400 dark:text-blue-500 mt-0.5 block">/docs/{doc.slug}/latest</code>
                      </div>
                      <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                        {doc.status !== 'published' && doc.status !== 'archived' && (
                          <button onClick={() => handlePublish(doc.slug)} className="btn-press text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-semibold transition-colors duration-200">Publish</button>
                        )}
                        {doc.status === 'published' && (<>
                          <a href={`/docs/${doc.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium transition-colors duration-200">View ↗</a>
                          <button onClick={() => handleArchive(doc.slug)} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors duration-200">Archive</button>
                        </>)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">Updated {new Date(doc.updatedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              /* Grid view */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredDocs.map(doc => (
                  <div key={doc.slug} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-card card-hover flex flex-col">
                    {/* Card header with gradient based on status */}
                    <div className={`px-4 pt-4 pb-3 ${
                      doc.status === 'published' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10' :
                      doc.status === 'draft' ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10' :
                      'bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded font-semibold truncate max-w-[120px]">{doc.productCode}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusBadge(doc.status)}`}>{doc.status}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight line-clamp-2">{doc.productName}</p>
                    </div>
                    <div className="px-4 py-3 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <code className="text-xs text-blue-400 dark:text-blue-500 block truncate">/docs/{doc.slug}/latest</code>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                          <span>{doc.versions?.length} version(s)</span>
                          <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {doc.status !== 'published' && doc.status !== 'archived' && (
                          <button onClick={() => handlePublish(doc.slug)} className="btn-press flex-1 text-xs bg-emerald-600 text-white py-1.5 rounded-lg hover:bg-emerald-700 font-semibold transition-colors duration-200">Publish</button>
                        )}
                        {doc.status === 'published' && (<>
                          <a href={`/docs/${doc.slug}`} target="_blank" rel="noopener noreferrer" className="btn-press flex-1 text-center text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-1.5 rounded-lg hover:bg-blue-100 font-medium transition-colors duration-200">View ↗</a>
                          <button onClick={() => handleArchive(doc.slug)} className="btn-press text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-200">⊘</button>
                        </>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── New / Add Version forms ── */}
        {(mode === 'new' || mode === 'version') && (
          <div className="animate-slide-up">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 space-y-4 shadow-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Slug (stable ID)" field="slug" placeholder="sikaflex-221--tds-en" />
                <F label="Product code" field="productCode" placeholder="Sikaflex-221" />
              </div>
              {mode === 'new' && <F label="Product name" field="productName" placeholder="Sikaflex-221 Multi-Purpose Sealant" />}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Version number" field="versionNumber" placeholder="1.0" />
                <S label="Document type" field="documentType" options={DOC_TYPES} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <S label="Language" field="language" options={LANGUAGES} />
                <F label="Product category" field="productCategory" placeholder="Sealing & Bonding" />
              </div>
              <F label="Title (optional)" field="title" placeholder="Technical Data Sheet" />
              <F label="EDMS Doc ID (optional)" field="edmsDocId" placeholder="EDMS-2026-001" />
              {mode === 'new' && <S label="Initial status" field="status" options={['draft', 'published']} />}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">PDF file *</label>
                <div onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') setFile(f); }}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${file ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-sika-red hover:bg-red-50 dark:hover:bg-red-900/10'}`}>
                  {file
                    ? <><p className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold">{file.name}</p><p className="text-xs text-emerald-500 mt-1">{(file.size/1024/1024).toFixed(2)} MB</p></>
                    : <><p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Click to select or drag and drop</p><p className="text-xs text-gray-300 dark:text-gray-600 mt-1">PDF only · Max 50MB</p></>
                  }
                  <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn-press w-full bg-sika-red hover:bg-sika-red-dark text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors duration-200 shadow-red">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</span> : mode === 'new' ? 'Create document' : 'Add new version'}
              </button>
            </form>
            {result && (
              <div className={`mt-4 p-4 rounded-xl border ${result.error ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'}`}>
                {result.error
                  ? <p className="text-red-700 dark:text-red-400 text-sm">{result.error}</p>
                  : <div className="space-y-2">
                      <p className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold">✓ {result.message}</p>
                      {result.dynamicUrl && <div><p className="text-xs text-gray-500 dark:text-gray-400">Dynamic URL</p><code className="text-xs text-blue-600 dark:text-blue-400 break-all">{result.dynamicUrl}</code></div>}
                      {result.fileHash && <div><p className="text-xs text-gray-500 dark:text-gray-400">SHA-256</p><code className="text-xs text-gray-500 dark:text-gray-400 break-all">{result.fileHash}</code></div>}
                    </div>
                }
              </div>
            )}
          </div>
        )}

        {/* ── EDMS Demo ── */}
        {mode === 'edms' && (
          <div className="space-y-4 animate-slide-up">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">EDMS Integration Demo</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Simulates Optimal Systems (yuuvis-rad) pushing an approved document. Flow: <strong>Push signal → File upload → Auto-publish</strong></p>
            </div>
            <form onSubmit={handleEdmsSubmit} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 space-y-4 shadow-card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Step 1 — EDMS identity</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['edmsDocId', 'edmsVersionId'] as const).map(field => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{field === 'edmsDocId' ? 'EDMS Doc ID' : 'EDMS Version ID'}</label>
                    <input type="text" defaultValue={edmsFormRef.current[field]} onChange={e => { edmsFormRef.current[field] = e.target.value; }}
                      className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Step 2 — Metadata</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['slug', 'productCode', 'productName'] as const).map((field, i) => (
                  <div key={field} className={i === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{field === 'slug' ? 'Slug' : field === 'productCode' ? 'Product Code' : 'Product Name'}</label>
                    <input type="text" defaultValue={edmsFormRef.current[field]} onChange={e => { edmsFormRef.current[field] = e.target.value; }}
                      className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Version</label>
                  <input type="text" defaultValue={edmsFormRef.current.versionNumber} onChange={e => { edmsFormRef.current.versionNumber = e.target.value; }}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Doc Type</label>
                  <select defaultValue={edmsFormRef.current.documentType} onChange={e => { edmsFormRef.current.documentType = e.target.value; }}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {['DoPC','SDS','TDS','Label','Technical','Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Language</label>
                  <select defaultValue={edmsFormRef.current.language} onChange={e => { edmsFormRef.current.language = e.target.value; }}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {['EN','DE','FR','IT','ES','NL','PL','PT','Other'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Step 3 — PDF file</p>
              <div onClick={() => edmsFileRef.current?.click()} onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') setEdmsFile(f); }}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${edmsFile ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'}`}>
                {edmsFile
                  ? <p className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold">{edmsFile.name} — {(edmsFile.size/1024/1024).toFixed(2)} MB</p>
                  : <p className="text-sm text-gray-400 dark:text-gray-500">Click or drag a PDF — simulates the file from Optimal Systems</p>
                }
                <input ref={edmsFileRef} type="file" accept="application/pdf" className="hidden" onChange={e => setEdmsFile(e.target.files?.[0] || null)} />
              </div>
              <button type="submit" disabled={edmsLoading}
                className="btn-press w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors duration-200">
                {edmsLoading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running EDMS flow…</span> : 'Simulate EDMS Push → Upload → Publish'}
              </button>
            </form>
            {edmsResult && (
              <div className={`p-5 rounded-xl border ${edmsResult.error ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'}`}>
                {edmsResult.error ? (
                  <p className="text-red-700 dark:text-red-400 text-sm">{edmsResult.error}</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-emerald-700 dark:text-emerald-400 text-sm font-bold">✓ All 3 steps completed</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {['Push signal', 'File upload', 'Published'].map((step, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-emerald-200 dark:border-emerald-800 p-2 text-center">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ {step}</span>
                        </div>
                      ))}
                    </div>
                    {edmsResult.upload?.dynamicUrl && <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Public URL</p><code className="text-xs text-blue-600 dark:text-blue-400 break-all">{edmsResult.upload.dynamicUrl}</code></div>}
                    {edmsResult.upload?.fileHash && <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">SHA-256</p><code className="text-xs text-gray-600 dark:text-gray-400 break-all">{edmsResult.upload.fileHash}</code></div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
