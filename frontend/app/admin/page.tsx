'use client';
import { useState, useRef, useEffect } from 'react';
import { adminApi } from '@/lib/api';

const DOC_TYPES = ['DoPC', 'SDS', 'TDS', 'Label', 'Technical', 'Other'];
const LANGUAGES = ['EN', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'PT', 'Other'];

type Mode = 'new' | 'version' | 'list';

interface DocItem {
  slug: string;
  productCode: string;
  productName: string;
  status: string;
  versions: { versionNumber: string }[];
  updatedAt: string;
}

export default function AdminPage() {
  const [mode, setMode] = useState<Mode>('new');
  const [form, setForm] = useState({
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
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const loadDocs = async () => {
    setDocsLoading(true);
    try {
      const { data } = await adminApi.listAll();
      setDocs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'list') loadDocs();
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please select a PDF file');
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('file', file);
      const { data } = mode === 'new'
        ? await adminApi.upload(fd)
        : await adminApi.addVersion(form.slug, fd);
      setResult({ success: true, ...data });
      if (mode === 'new') {
        setForm(p => ({ ...p, slug: '', productCode: '', productName: '', edmsDocId: '' }));
      }
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) {
      setResult({ error: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (slug: string) => {
    try {
      await adminApi.publish(slug);
      loadDocs();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to publish');
    }
  };

  const handleArchive = async (slug: string) => {
    if (!confirm(`Archive ${slug}? It will no longer be publicly accessible.`)) return;
    try {
      await adminApi.archive(slug);
      loadDocs();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to archive');
    }
  };

  const Input = ({
    label, field, type = 'text', placeholder = '',
  }: {
    label: string; field: string; type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <input
        type={type}
        value={form[field as keyof typeof form]}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm
                   focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-transparent"
      />
    </div>
  );

  const Select = ({ label, field, options }: { label: string; field: string; options: string[] }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <select
        value={form[field as keyof typeof form]}
        onChange={(e) => set(field, e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm
                   focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-transparent bg-white"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const STATUS_COLORS: Record<string, string> = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-gray-100 text-gray-500',
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Document management - POC (add auth in production)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/how-it-works"
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium border border-blue-200"
            >
               How It Works</a>
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 underline">
              &lt;- Public site
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Mode tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6 w-fit gap-1">
          {([
            { key: 'new', label: 'New document' },
            { key: 'version', label: 'Add version' },
            { key: 'list', label: 'All documents' },
          ] as { key: Mode; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                mode === key
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Upload form */}
        {(mode === 'new' || mode === 'version') && (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Slug (stable ID)"
                field="slug"
                placeholder="sikaflex-221--tds-en"
              />
              <Input
                label="Product code"
                field="productCode"
                placeholder="SikaFlex-221"
              />
            </div>

            {mode === 'new' && (
              <Input
                label="Product name"
                field="productName"
                placeholder="SikaFlex-221 Polyurethane Sealant"
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Version number"
                field="versionNumber"
                placeholder="1.0"
              />
              <Select label="Document type" field="documentType" options={DOC_TYPES} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select label="Language" field="language" options={LANGUAGES} />
              <Input label="Product category" field="productCategory" placeholder="Sealants" />
            </div>

            <Input label="Title (optional)" field="title" placeholder="Technical Data Sheet" />
            <Input label="EDMS Doc ID (optional)" field="edmsDocId" placeholder="OPT-12345" />

            {mode === 'new' && (
              <Select label="Status" field="status" options={['draft', 'published']} />
            )}

            {/* File drop zone */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                PDF file *
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dropped = e.dataTransfer.files[0];
                  if (dropped?.type === 'application/pdf') setFile(dropped);
                }}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                            transition-colors select-none ${
                              file
                                ? 'border-green-400 bg-green-50'
                                : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                            }`}
              >
                {file ? (
                  <div>
                    <p className="text-sm text-green-700 font-medium">{file.name}</p>
                    <p className="text-xs text-green-500 mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB - click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl mb-1"></p>
                    <p className="text-sm text-gray-400">
                      Click to select or drag &amp; drop PDF
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">Max 50 MB</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm
                         hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading
                ? 'Uploading...'
                : mode === 'new'
                ? 'Create document'
                : 'Add new version'}
            </button>
          </form>
        )}

        {/* Result feedback */}
        {result && (mode === 'new' || mode === 'version') && (
          <div
            className={`mt-4 p-4 rounded-lg border ${
              result.error
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            {result.error ? (
              <p className="text-red-700 text-sm">{result.error}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-green-700 text-sm font-medium">{result.message}</p>
                {result.dynamicUrl && (
                  <div>
                    <p className="text-xs text-gray-500">Dynamic URL</p>
                    <code className="text-xs text-blue-600 break-all">{result.dynamicUrl}</code>
                  </div>
                )}
                {result.versionUrl && (
                  <div>
                    <p className="text-xs text-gray-500">Version URL</p>
                    <code className="text-xs text-amber-600 break-all">{result.versionUrl}</code>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Document list */}
        {mode === 'list' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{docs.length} documents</p>
              <button
                onClick={loadDocs}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Refresh
              </button>
            </div>
            {docsLoading ? (
              <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
            ) : docs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No documents yet</p>
            ) : (
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div
                    key={doc.slug}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {doc.productCode}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              STATUS_COLORS[doc.status] || STATUS_COLORS.draft
                            }`}
                          >
                            {doc.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {doc.versions?.length} version(s)
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">{doc.productName}</p>
                        <code className="text-xs text-gray-400">/docs/{doc.slug}/latest</code>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {doc.status !== 'published' && doc.status !== 'archived' && (
                          <button
                            onClick={() => handlePublish(doc.slug)}
                            className="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded
                                       hover:bg-green-700 transition-colors font-medium"
                          >
                            Publish
                          </button>
                        )}
                        {doc.status === 'published' && (
                          <>
                            <a
                              href={`/docs/${doc.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded
                                         hover:bg-blue-100 transition-colors font-medium"
                            >
                              View
                            </a>
                            <button
                              onClick={() => handleArchive(doc.slug)}
                              className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1.5 rounded
                                         hover:bg-gray-200 transition-colors font-medium"
                            >
                              Archive
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 mt-2">
                      Updated {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

