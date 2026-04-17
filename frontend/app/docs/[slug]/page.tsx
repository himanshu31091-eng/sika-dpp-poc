'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { publicApi } from '@/lib/api';

interface VersionMeta {
  versionNumber: string;
  versionTag: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  title?: string;
  language?: string;
  documentType?: string;
  productCategory?: string;
  issueDate?: string;
}

interface DocData {
  slug: string;
  productCode: string;
  productName: string;
  currentVersion?: VersionMeta;
  version?: VersionMeta;
  versionCount?: number;
  isLatest?: boolean;
  supersededAt?: string;
}

interface VersionListItem extends VersionMeta {
  isLatest: boolean;
  supersededAt?: string;
  url: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  DoPC: 'Declaration of Performance & Conformity',
  SDS: 'Safety Data Sheet',
  TDS: 'Technical Data Sheet',
  Label: 'Product Label',
  Technical: 'Technical Documentation',
  Other: 'Document',
};

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function QRModal({ url, onClose }: { url: string; onClose: () => void }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">QR Code — Scan to access</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="flex flex-col items-center">
          <img src={qrUrl} alt="QR Code" className="w-48 h-48 border border-gray-200 rounded-lg" />
          <p className="text-xs text-gray-400 mt-3 text-center break-all">{url}</p>
          <a
            href={qrUrl}
            download="sika-dpp-qr.png"
            className="mt-4 w-full bg-red-600 text-white text-sm font-medium py-2 rounded-lg text-center hover:bg-red-700 transition-colors"
          >
            Download QR Code
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DocPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const requestedVersion = searchParams.get('v');
  const router = useRouter();

  const [doc, setDoc] = useState<DocData | null>(null);
  const [versions, setVersions] = useState<VersionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [showQR, setShowQR] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [docRes, versRes] = await Promise.all([
          requestedVersion
            ? publicApi.getVersion(slug, requestedVersion)
            : publicApi.getLatest(slug),
          publicApi.getVersionList(slug),
        ]);
        setDoc(docRes.data);
        setVersions(versRes.data.versions || []);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Document not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, requestedVersion]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading document...</p>
      </div>
    </div>
  );

  if (error || !doc) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 text-sm mb-3">{error || 'Document not found'}</p>
        <button onClick={() => router.push('/')} className="text-xs text-gray-400 underline">Back to search</button>
      </div>
    </div>
  );

  const version = doc.currentVersion || doc.version!;
  const isLatest = doc.isLatest !== false;
  const pdfProxyUrl = `/api/pdf-proxy?slug=${slug}&version=${version.versionNumber}`;
  const downloadUrl = publicApi.getDownloadUrl(slug, version.versionNumber);
  const dynamicUrl = typeof window !== 'undefined' ? `${window.location.origin}/docs/${slug}/latest` : '';
  const versionUrl = typeof window !== 'undefined' ? `${window.location.origin}/docs/${slug}/v/${version.versionNumber}` : '';

  return (
    <>
      {showQR && <QRModal url={showQR} onClose={() => setShowQR(null)} />}
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
              <span className="text-gray-200">|</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded shrink-0">{doc.productCode}</span>
                <h1 className="text-sm font-medium text-gray-800 truncate">{doc.productName}</h1>
                {isLatest
                  ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">latest</span>
                  : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">archived</span>
                }
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">
          <aside className="col-span-1 space-y-4">

            {/* Document info */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Document info</p>
              <dl className="space-y-2.5">
                <div><dt className="text-xs text-gray-400">Type</dt><dd className="text-xs font-medium text-gray-700 mt-0.5">{DOC_TYPE_LABELS[version.documentType || ''] || version.documentType || '—'}</dd></div>
                <div><dt className="text-xs text-gray-400">Language</dt><dd className="text-xs text-gray-700 mt-0.5">{version.language || '—'}</dd></div>
                <div><dt className="text-xs text-gray-400">Version</dt><dd className="text-xs font-mono text-gray-700 mt-0.5">{version.versionNumber}</dd></div>
                <div><dt className="text-xs text-gray-400">File size</dt><dd className="text-xs text-gray-700 mt-0.5">{formatBytes(version.fileSize)}</dd></div>
                <div><dt className="text-xs text-gray-400">Uploaded</dt><dd className="text-xs text-gray-700 mt-0.5">{new Date(version.uploadedAt).toLocaleDateString()}</dd></div>
              </dl>
            </div>

            {/* Stable URLs */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Stable links</p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 font-medium">Dynamic (always latest)</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowQR(dynamicUrl)} className="text-xs text-purple-500 hover:text-purple-700 font-medium">QR</button>
                      <button onClick={() => copyToClipboard(dynamicUrl, 'dynamic')} className="text-xs text-gray-400 hover:text-gray-600">{copied === 'dynamic' ? '✓' : 'copy'}</button>
                    </div>
                  </div>
                  <code className="text-xs text-blue-600 break-all block bg-blue-50 rounded px-2 py-1.5">/docs/{slug}/latest</code>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 font-medium">Version-specific (immutable)</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowQR(versionUrl)} className="text-xs text-purple-500 hover:text-purple-700 font-medium">QR</button>
                      <button onClick={() => copyToClipboard(versionUrl, 'version')} className="text-xs text-gray-400 hover:text-gray-600">{copied === 'version' ? '✓' : 'copy'}</button>
                    </div>
                  </div>
                  <code className="text-xs text-amber-600 break-all block bg-amber-50 rounded px-2 py-1.5">/docs/{slug}/v/{version.versionNumber}</code>
                </div>
              </div>
            </div>

            {/* QR quick access */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">QR Code / DPP</p>
              <div className="flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(dynamicUrl)}`}
                  alt="QR Code"
                  className="w-32 h-32 rounded-lg border border-gray-200"
                />
                <p className="text-xs text-gray-400 mt-2 text-center">Points to latest version</p>
                <button
                  onClick={() => setShowQR(dynamicUrl)}
                  className="mt-2 w-full text-xs bg-red-600 text-white py-1.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  View full size + download
                </button>
              </div>
            </div>

            {/* Version history */}
            {versions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Version history ({versions.length})</p>
                <ul className="space-y-1">
                  {[...versions].reverse().map((v) => (
                    <li key={v.versionNumber}>
                      <button
                        onClick={() => v.isLatest ? router.push(`/docs/${slug}`) : router.push(`/docs/${slug}?v=${v.versionNumber}`)}
                        className={`w-full text-left flex items-center justify-between text-xs rounded px-2.5 py-2 transition-colors ${v.versionNumber === version.versionNumber ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        <span className="font-mono">v{v.versionNumber}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-300">{new Date(v.uploadedAt).toLocaleDateString('en', { month: 'short', year: '2-digit' })}</span>
                          {v.isLatest && <span className="text-green-500">●</span>}
                          {v.supersededAt && !v.isLatest && <span className="text-gray-300 text-xs">archived</span>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* PDF viewer */}
          <div className="col-span-2">
            {!isLatest && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                <p className="text-sm text-amber-700">Archived version ({version.versionNumber}) — superseded.</p>
                <button onClick={() => router.push(`/docs/${slug}`)} className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded font-medium hover:bg-amber-700 ml-4 shrink-0">View latest</button>
              </div>
            )}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <span className="text-xs text-gray-600 truncate">{version.fileName}</span>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-red-600 text-white px-3 py-1.5 rounded font-medium hover:bg-red-700 transition-colors shrink-0 ml-3">
                  Download PDF
                </a>
              </div>
              <iframe src={pdfProxyUrl} className="w-full" style={{ height: '72vh', minHeight: '500px' }} title={version.fileName} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
