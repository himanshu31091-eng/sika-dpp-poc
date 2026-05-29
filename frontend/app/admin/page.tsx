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
  published: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
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
      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-400 mt-0.5">Document management - POC</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/how-it-works" className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 font-medium hover:bg-blue-100">
              How It Works
            </a>
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 underline">Back to site</a>
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
              <span className="text-xs text-gray-400">👤 {currentUser}</span>
              <button onClick={handleLogout} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1.5 rounded hover:bg-gray-200 font-medium">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6 w-fit gap-1">
          {(currentUser === 'himanshu' ? ['dashboard', 'new', 'version', 'list', 'edms'] : ['new', 'version', 'list'] as Mode[]).map(k => (
            <button key={k} onClick={() => setMode(k as Mode)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${mode === k ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {k === 'dashboard' ? 'Dashboard' : k === 'new' ? 'New document' : k === 'version' ? 'Add version' : k === 'list' ? 'All documents' : 'EDMS Demo'}
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
                <p className="text-center text-gray-400 text-sm py-12">Loading...</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: 'Total', value: total, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                      { label: 'Published', value: published, color: 'bg-green-50 text-green-700 border-green-200' },
                      { label: 'Drafts', value: drafts.length, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                      { label: 'Archived', value: archived, color: 'bg-gray-50 text-gray-500 border-gray-200' },
                    ].map(card => (
                      <div key={card.label} className={`rounded-lg border p-4 ${card.color}`}>
                        <p className="text-xs font-medium uppercase tracking-wide opacity-70">{card.label}</p>
                        <p className="text-3xl font-bold mt-1">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  {analytics && (
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Total views', value: analytics.totalViews, color: 'bg-purple-50 text-purple-700 border-purple-200' },
                        { label: 'Total downloads', value: analytics.totalDownloads, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                      ].map(card => (
                        <div key={card.label} className={`rounded-lg border p-4 ${card.color}`}>
                          <p className="text-xs font-medium uppercase tracking-wide opacity-70">{card.label}</p>
                          <p className="text-3xl font-bold mt-1">{card.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {drafts.length > 0 && (
                    <div className="bg-white border border-yellow-200 rounded-lg p-4">
                      <h2 className="text-sm font-semibold text-gray-700 mb-3">Drafts pending publish ({drafts.length})</h2>
                      <div className="space-y-2">
                        {drafts.map(doc => (
                          <div key={doc.slug} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{doc.productName}</p>
                              <p className="text-xs text-gray-400">{doc.productCode} · {doc.versions?.length} version(s)</p>
                            </div>
                            <button
                              onClick={async () => { try { await adminApi.publish(doc.slug); loadDashboard(); } catch { alert('Failed'); } }}
                              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 font-medium shrink-0"
                            >
                              Publish
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analytics && analytics.byDocument.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h2 className="text-sm font-semibold text-gray-700 mb-3">Top documents by activity</h2>
                      <div className="space-y-2">
                        {analytics.byDocument.slice(0, 5).map((item: any) => (
                          <div key={item.slug} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                            <p className="text-sm text-gray-700 truncate flex-1 mr-4">{item.slug}</p>
                            <div className="flex gap-3 shrink-0 text-xs">
                              <span className="text-purple-600">{item.views} views</span>
                              <span className="text-indigo-600">{item.downloads} dl</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-gray-700">Recently updated</h2>
                      <button onClick={loadDashboard} className="text-xs text-gray-400 hover:text-gray-600 underline">Refresh</button>
                    </div>
                    {recent.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">No documents yet</p>
                    ) : (
                      <div className="space-y-2">
                        {recent.map(doc => (
                          <div key={doc.slug} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{doc.productName}</p>
                              <p className="text-xs text-gray-400">{doc.productCode}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${SC[doc.status] || SC.draft}`}>{doc.status}</span>
                              <span className="text-xs text-gray-300">{new Date(doc.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {auditLogs.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-gray-700">Recent activity</h2>
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
                          className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1.5 rounded hover:bg-gray-200 font-medium"
                        >
                          Export CSV
                        </button>
                      </div>
                      <div className="space-y-1">
                        {auditLogs.map((log: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0 gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
                                log.action === 'publish' ? 'bg-green-100 text-green-700' :
                                log.action === 'archive' ? 'bg-gray-100 text-gray-500' :
                                log.action === 'create' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>{log.action}</span>
                              <span className="text-xs text-gray-600 truncate">{log.slug}{log.version ? ` v${log.version}` : ''}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-xs text-gray-400">
                              <span>{log.performedBy}</span>
                              <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
