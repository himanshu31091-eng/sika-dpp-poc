'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
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

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [mode, setMode] = useState<Mode>('new');
  const [dashboardDocs, setDashboardDocs] = useState<DocItem[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<{ totalViews: number; totalDownloads: number; byDocument: any[] } | null>(null);
  const [edmsResult, setEdmsResult] = useState<any>(null);
  const [edmsLoading, setEdmsLoading] = useState(false);
  const [edmsFile, setEdmsFile] = useState<File | null>(null);
  const edmsFileRef = useRef<HTMLInputElement>(null);
  const edmsFormRef = useRef({
    edmsDocId: 'EDMS-2026-001',
    edmsVersionId: 'v1',
    slug: 'sikadur-32--tds-en',
    productCode: 'Sikadur-32',
    productName: 'Sikadur-32 Normal Epoxy Adhesive',
    versionNumber: '1.0',
    documentType: 'TDS',
    language: 'EN',
    productCategory: 'Concrete',
    title: 'Technical Data Sheet -- Sikadur-32',
  });
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // All form data in ONE ref — no re-renders when anything changes
  const formRef = useRef({
    slug: '',
    productCode: '',
    productName: '',
    versionNumber: '1.0',
    title: '',
    language: 'EN',
    documentType: 'TDS',
    productCategory: '',
    edmsDocId: '',
    status: 'draft',
  });

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    const user = localStorage.getItem('admin_user') || '';
    if (!auth) {
      router.replace('/admin/login');
    } else {
      setCurrentUser(user);
      setAuthChecked(true);
      if (user === 'himanshu') setMode('dashboard');
    }
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
      const [docsRes, auditRes, analyticsRes] = await Promise.all([
        adminApi.listAll(),
        adminApi.getAudit(20),
        adminApi.getAnalytics(),
      ]);
      setDashboardDocs(docsRes.data);
      setAuditLogs(auditRes.data);
      setAnalytics(analyticsRes.data);
    } catch (e) { console.error(e); }
    finally { setDashboardLoading(false); }
  }, []);

  useEffect(() => { if (mode === 'list') loadDocs(); }, [mode, loadDocs]);
  useEffect(() => { if (mode === 'dashboard') loadDashboard(); }, [mode, loadDashboard]);

  const handleEdmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edmsFile) return alert('Please select a PDF file');
    setEdmsLoading(true);
    setEdmsResult(null);
    try {
      const f = edmsFormRef.current;
      // Step 1 — simulate EDMS push signal
      const { data: pushData } = await adminApi.edmsPush({
        edmsDocId: f.edmsDocId,
        edmsVersionId: f.edmsVersionId,
        slug: f.slug,
        productCode: f.productCode,
        productName: f.productName,
        versionNumber: f.versionNumber,
        documentType: f.documentType,
        language: f.language,
        title: f.title,
      });

      // Step 2 — upload file via the action the push returned
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      fd.append('file', edmsFile);

      const { data: uploadData } = pushData.action === 'create_pending'
        ? await adminApi.upload(fd)
        : await adminApi.addVersion(f.slug, fd);

      // Step 3 — auto-publish
      await adminApi.publish(f.slug);

      setEdmsResult({ success: true, push: pushData, upload: uploadData });
      setEdmsFile(null);
      if (edmsFileRef.current) edmsFileRef.current.value = '';
    } catch (err: any) {
      setEdmsResult({ error: err.response?.data?.error || err.message });
    } finally {
      setEdmsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please select a PDF file');
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      const f = formRef.current;
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      fd.append('file', file);
      const { data } = mode === 'new'
        ? await adminApi.upload(fd)
        : await adminApi.addVersion(f.slug, fd);
      setResult({ success: true, ...data });
      if (mode === 'new') {
        formRef.current.slug = '';
        formRef.current.productCode = '';
        formRef.current.productName = '';
        formRef.current.edmsDocId = '';
      }
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) {
      setResult({ error: err.response?.data?.error || err.message });
    } finally { setLoading(false); }
  };

  const handlePublish = async (slug: string) => {
    try { await adminApi.publish(slug); loadDocs(); }
    catch { alert('Failed'); }
  };

  const handleArchive = async (slug: string) => {
    if (!confirm('Archive ' + slug + '?')) return;
    try { await adminApi.archive(slug); loadDocs(); }
    catch { alert('Failed'); }
  };

  // Simple uncontrolled text input — reads/writes directly to formRef
  const F = ({ label, field, placeholder }: { label: string; field: keyof typeof formRef.current; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type="text"
        defaultValue={formRef.current[field]}
        placeholder={placeholder}
        onChange={e => { formRef.current[field] = e.target.value as any; }}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
      />
    </div>
  );

  // Uncontrolled select — no state, just writes to formRef
  const S = ({ label, field, options }: { label: string; field: keyof typeof formRef.current; options: string[] }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <select
        defaultValue={formRef.current[field]}
        onChange={e => { formRef.current[field] = e.target.value as any; }}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  if (!authChecked) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-10 h-10 border-2 border-sika-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading admin panel…</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-card">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sika-red rounded-lg flex items-center justify-center shadow-red-sm">
              <span className="text-white text-sm font-bold leading-none">S</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-400">Document management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/how-it-works"
              className="hidden sm:flex text-xs text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors duration-200">
              How It Works
            </a>
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200">
              ← Site
            </a>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg">
                <div className="w-5 h-5 bg-sika-red rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold leading-none">{currentUser[0]?.toUpperCase()}</span>
                </div>
                <span className="text-xs font-medium text-gray-700">{currentUser}</span>
              </div>
              <button onClick={handleLogout}
                className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 hover:text-gray-700 font-medium transition-all duration-200">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex bg-gray-100/80 backdrop-blur rounded-xl p-1 mb-8 gap-0.5 shadow-inner-sm overflow-x-auto w-full sm:w-fit">
          {(currentUser === 'himanshu' ? ['dashboard', 'new', 'version', 'list', 'edms'] : ['new', 'version', 'list'] as Mode[]).map(k => (
            <button key={k} onClick={() => setMode(k as Mode)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 btn-press ${
                mode === k
                  ? 'bg-white shadow-card text-gray-900 scale-[1.02]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
              }`}>
              {k === 'dashboard' ? '◈ Dashboard' : k === 'new' ? '+ New document' : k === 'version' ? '↑ Add version' : k === 'list' ? '☰ All documents' : '⇄ EDMS Demo'}
            </button>
          ))}
        </div>

        {mode === 'dashboard' && (() => {
          const total = dashboardDocs.length;
          const published = dashboardDocs.filter(d => d.status === 'published').length;
          const drafts = dashboardDocs.filter(d => d.status === 'draft');
          const archived = dashboardDocs.filter(d => d.status === 'archived').length;
          const recent = [...dashboardDocs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
          return (
            <div className="space-y-6">
              {dashboardLoading ? (
                <div className="py-16 text-center animate-fade-in">
                  <div className="w-8 h-8 border-2 border-sika-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Loading dashboard…</p>
                </div>
              ) : (
                <>
                  {/* All stat cards in one row */}
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 stagger animate-slide-up">
                    {[
                      { label: 'Total',      value: total,                                    bg: 'from-slate-800 to-slate-700' },
                      { label: 'Published',  value: published,                                bg: 'from-emerald-600 to-emerald-500' },
                      { label: 'Drafts',     value: drafts.length,                            bg: 'from-amber-500 to-amber-400' },
                      { label: 'Archived',   value: archived,                                 bg: 'from-gray-400 to-gray-300' },
                      { label: 'Views',      value: analytics?.totalViews ?? '—',             bg: 'from-violet-600 to-violet-500' },
                      { label: 'Downloads',  value: analytics?.totalDownloads ?? '—',         bg: 'from-indigo-600 to-indigo-500' },
                    ].map(card => (
                      <div key={card.label} className={`rounded-xl p-5 bg-gradient-to-br ${card.bg} shadow-card-md`}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">{card.label}</p>
                        <p className="text-3xl font-bold text-white leading-none">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Two-column layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* LEFT: drafts + top docs */}
                    <div className="space-y-4">
                      {drafts.length > 0 && (
                        <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-card">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 text-xs font-bold">{drafts.length}</span>
                            <h2 className="text-sm font-semibold text-gray-800">Drafts pending publish</h2>
                          </div>
                          <div className="space-y-1">
                            {drafts.map(doc => (
                              <div key={doc.slug} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg hover:bg-amber-50 transition-colors duration-150">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{doc.productName}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{doc.productCode} · {doc.versions?.length} version(s)</p>
                                </div>
                                <button
                                  onClick={async () => { try { await adminApi.publish(doc.slug); loadDashboard(); } catch { alert('Failed'); } }}
                                  className="btn-press text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-semibold shrink-0 transition-colors duration-200">
                                  Publish
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analytics && analytics.byDocument.length > 0 && (
                        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
                          <h2 className="text-sm font-semibold text-gray-800 mb-4">Top by activity</h2>
                          <div className="space-y-3">
                            {analytics.byDocument.slice(0, 5).map((item: any, i: number) => {
                              const tot = item.views + item.downloads;
                              const mx = analytics.byDocument[0].views + analytics.byDocument[0].downloads || 1;
                              return (
                                <div key={item.slug}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-xs text-gray-300 w-4 shrink-0">{i+1}</span>
                                      <p className="text-xs text-gray-700 truncate font-medium">{item.slug}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0 text-xs ml-2">
                                      <span className="text-violet-600 font-medium">{item.views}v</span>
                                      <span className="text-indigo-600 font-medium">{item.downloads}d</span>
                                    </div>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                                      style={{ width: `${(tot / mx) * 100}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: recently updated + audit log */}
                    <div className="space-y-4">
                      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-sm font-semibold text-gray-800">Recently updated</h2>
                          <button onClick={loadDashboard} className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200">↺ Refresh</button>
                        </div>
                        {recent.length === 0 ? (
                          <p className="text-sm text-gray-400 py-6 text-center">No documents yet</p>
                        ) : (
                          <div className="space-y-1">
                            {recent.map(doc => (
                              <div key={doc.slug} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{doc.productName}</p>
                                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{doc.productCode}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${SC[doc.status] || SC.draft}`}>{doc.status}</span>
                                  <span className="text-xs text-gray-300 hidden sm:block">{new Date(doc.updatedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {auditLogs.length > 0 && (
                        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-gray-800">Audit log</h2>
                            <button
                              onClick={() => {
                                const header = 'Timestamp,Action,Slug,Version,Performed By,IP\n';
                                const rows = auditLogs.map((l: any) =>
                                  [new Date(l.timestamp).toISOString(), l.action, l.slug, l.version || '', l.performedBy, l.ip || ''].join(',')
                                ).join('\n');
                                const blob = new Blob([header + rows], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`;
                                a.click(); URL.revokeObjectURL(url);
                              }}
                              className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1.5 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-200">
                              Export CSV
                            </button>
                          </div>
                          <div className="space-y-1">
                            {auditLogs.map((log: any, i: number) => {
                              const actionStyle: Record<string, string> = {
                                publish: 'bg-emerald-100 text-emerald-700',
                                archive: 'bg-gray-100 text-gray-500',
                                create:  'bg-blue-100 text-blue-700',
                                add_version: 'bg-violet-100 text-violet-700',
                              };
                              const actionIcon: Record<string, string> = { publish: '✓', archive: '⊘', create: '+', add_version: '↑' };
                              return (
                                <div key={i} className="flex items-start gap-3 py-2">
                                  <div className="flex flex-col items-center shrink-0 mt-0.5">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${actionStyle[log.action] || 'bg-gray-100 text-gray-500'}`}>
                                      {actionIcon[log.action] || '?'}
                                    </span>
                                    {i < auditLogs.length - 1 && <div className="w-px h-3 bg-gray-100 mt-1" />}
                                  </div>
                                  <div className="flex-1 min-w-0 pb-2 border-b border-gray-50 last:border-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-semibold text-gray-700 capitalize">{log.action.replace('_', ' ')}</span>
                                      <span className="text-xs text-gray-300 shrink-0">{new Date(log.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                      <span className="font-mono">{log.slug}</span>
                                      {log.version && <span className="text-gray-300"> · v{log.version}</span>}
                                      <span className="text-gray-300"> · {log.performedBy}</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>{/* end two-column */}
                </>
              )}
            </div>
          );
        })()}

        {mode === 'edms' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">EDMS Integration Demo</p>
              <p className="text-xs text-blue-600">
                Simulates Optimal Systems (yuuvis-rad) pushing an approved document to the public repository.
                The flow runs 3 steps automatically: <strong>Push signal → File upload → Auto-publish</strong>.
              </p>
            </div>

            <form onSubmit={handleEdmsSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Step 1 — EDMS document identity</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">EDMS Doc ID</label>
                  <input type="text" defaultValue={edmsFormRef.current.edmsDocId}
                    onChange={e => { edmsFormRef.current.edmsDocId = e.target.value; }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">EDMS Version ID</label>
                  <input type="text" defaultValue={edmsFormRef.current.edmsVersionId}
                    onChange={e => { edmsFormRef.current.edmsVersionId = e.target.value; }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Step 2 — Product metadata</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Slug</label>
                  <input type="text" defaultValue={edmsFormRef.current.slug}
                    onChange={e => { edmsFormRef.current.slug = e.target.value; }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Product Code</label>
                  <input type="text" defaultValue={edmsFormRef.current.productCode}
                    onChange={e => { edmsFormRef.current.productCode = e.target.value; }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Product Name</label>
                <input type="text" defaultValue={edmsFormRef.current.productName}
                  onChange={e => { edmsFormRef.current.productName = e.target.value; }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Version</label>
                  <input type="text" defaultValue={edmsFormRef.current.versionNumber}
                    onChange={e => { edmsFormRef.current.versionNumber = e.target.value; }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Doc Type</label>
                  <select defaultValue={edmsFormRef.current.documentType}
                    onChange={e => { edmsFormRef.current.documentType = e.target.value; }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                    {['DoPC','SDS','TDS','Label','Technical','Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Language</label>
                  <select defaultValue={edmsFormRef.current.language}
                    onChange={e => { edmsFormRef.current.language = e.target.value; }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                    {['EN','DE','FR','IT','ES','NL','PL','PT','Other'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Step 3 — PDF file</p>
              <div
                onClick={() => edmsFileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') setEdmsFile(f); }}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${edmsFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'}`}>
                {edmsFile
                  ? <p className="text-sm text-green-700 font-medium">{edmsFile.name} ({(edmsFile.size/1024/1024).toFixed(2)} MB)</p>
                  : <p className="text-sm text-gray-400">Click or drag a PDF — simulates the file Optimal Systems would provide</p>
                }
                <input ref={edmsFileRef} type="file" accept="application/pdf" className="hidden"
                  onChange={e => setEdmsFile(e.target.files?.[0] || null)} />
              </div>

              <button type="submit" disabled={edmsLoading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {edmsLoading ? 'Running EDMS flow...' : 'Simulate EDMS Push → Upload → Publish'}
              </button>
            </form>

            {edmsResult && (
              <div className={`p-4 rounded-lg border ${edmsResult.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                {edmsResult.error ? (
                  <p className="text-red-700 text-sm">{edmsResult.error}</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-green-700 text-sm font-semibold">All 3 steps completed successfully</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {['Push signal', 'File upload', 'Published'].map((step, i) => (
                        <div key={i} className="bg-white rounded border border-green-200 p-2 text-center">
                          <span className="text-green-600 font-medium">✓ {step}</span>
                        </div>
                      ))}
                    </div>
                    {edmsResult.upload?.dynamicUrl && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Public URL (dynamic)</p>
                        <code className="text-xs text-blue-600 break-all">{edmsResult.upload.dynamicUrl}</code>
                      </div>
                    )}
                    {edmsResult.upload?.fileHash && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">SHA-256 integrity hash</p>
                        <code className="text-xs text-gray-600 break-all">{edmsResult.upload.fileHash}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(mode === 'new' || mode === 'version') && (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <F label="Slug (stable ID)" field="slug" placeholder="cardiotrack-x1--ifu-en" />
              <F label="Product code" field="productCode" placeholder="CardioTrack-X1" />
            </div>
            {mode === 'new' && (
              <F label="Product name" field="productName" placeholder="CardioTrack-X1 Cardiac Monitor" />
            )}
            <div className="grid grid-cols-2 gap-4">
              <F label="Version number" field="versionNumber" placeholder="1.0" />
              <S label="Document type" field="documentType" options={DOC_TYPES} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <S label="Language" field="language" options={LANGUAGES} />
              <F label="Product category" field="productCategory" placeholder="Medical Devices" />
            </div>
            <F label="Title (optional)" field="title" placeholder="Instructions for Use" />
            <F label="EDMS Doc ID (optional)" field="edmsDocId" placeholder="MoreYeahs-12345" />
            {mode === 'new' && (
              <S label="Status" field="status" options={['draft', 'published']} />
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">PDF file *</label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') setFile(f); }}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-red-400'}`}
              >
                {file
                  ? <p className="text-sm text-green-700 font-medium">{file.name} ({(file.size/1024/1024).toFixed(2)} MB)</p>
                  : <p className="text-sm text-gray-400">Click to select or drag and drop PDF (max 50MB)</p>
                }
                <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 disabled:opacity-50 transition-colors">
              {loading ? 'Uploading...' : mode === 'new' ? 'Create document' : 'Add new version'}
            </button>
          </form>
        )}

        {result && (mode === 'new' || mode === 'version') && (
          <div className={`mt-4 p-4 rounded-lg border ${result.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            {result.error
              ? <p className="text-red-700 text-sm">{result.error}</p>
              : <div className="space-y-2">
                  <p className="text-green-700 text-sm font-medium">{result.message}</p>
                  {result.dynamicUrl && <div><p className="text-xs text-gray-500">Dynamic URL</p><code className="text-xs text-blue-600 break-all">{result.dynamicUrl}</code></div>}
                  {result.versionUrl && <div><p className="text-xs text-gray-500">Version URL</p><code className="text-xs text-amber-600 break-all">{result.versionUrl}</code></div>}
                </div>
            }
          </div>
        )}

        {mode === 'list' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{docs.length} documents</p>
              <button onClick={loadDocs} className="text-xs text-gray-400 hover:text-gray-600 underline">Refresh</button>
            </div>
            {docsLoading ? <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
              : docs.length === 0 ? <p className="text-center text-gray-400 text-sm py-8">No documents yet</p>
              : <div className="space-y-2">
                  {docs.map(doc => (
                    <div key={doc.slug} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-mono bg-gray-100 text-gray-400 px-2 py-0.5 rounded">{doc.productCode}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${SC[doc.status] || SC.draft}`}>{doc.status}</span>
                            <span className="text-xs text-gray-400">{doc.versions?.length} version(s)</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800">{doc.productName}</p>
                          <code className="text-xs text-gray-400">/docs/{doc.slug}/latest</code>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {doc.status !== 'published' && doc.status !== 'archived' && (
                            <button onClick={() => handlePublish(doc.slug)} className="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded hover:bg-green-700 font-medium">Publish</button>
                          )}
                          {doc.status === 'published' && (<>
                            <a href={`/docs/${doc.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded hover:bg-blue-100 font-medium">View</a>
                            <button onClick={() => handleArchive(doc.slug)} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1.5 rounded hover:bg-gray-200 font-medium">Archive</button>
                          </>)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 mt-2">Updated {new Date(doc.updatedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}
      </div>
    </main>
  );
}
