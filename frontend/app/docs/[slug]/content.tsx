'use client';
import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { publicApi } from '@/lib/api';

interface VersionMeta {
  versionNumber: string;
  versionTag: string;
  fileName: string;
  fileSize: number;
  fileHash?: string;
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
  DoPC: 'Declaration of Performance',
  SDS: 'Safety Data Sheet',
  TDS: 'Technical Data Sheet',
  Label: 'Product Label',
  Technical: 'Technical Documentation',
  Other: 'Document',
};

function formatBytes(bytes: number) {
  if (!bytes) return '';
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function QRModal({ url, onClose }: { url: string; onClose: () => void }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-xs" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="flex flex-col items-center">
          <img src={qrUrl} alt="QR Code" className="w-48 h-48 border border-gray-200 rounded-lg" />
          <p className="text-xs text-gray-400 mt-3 text-center break-all">{url}</p>
          <a href={qrUrl} download="qr-code.png"
            className="mt-4 w-full bg-red-600 text-white text-sm font-medium py-2 rounded-lg text-center hover:bg-red-700">
            Download QR Code
          </a>
        </div>
      </div>
    </div>
  );
}

function DocContent() {
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
  const [showInfo, setShowInfo] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [docRes, versRes] = await Promise.all([
          requestedVersion ? publicApi.getVersion(slug, requestedVersion) : publicApi.getLatest(slug),
          publicApi.getVersionList(slug),
        ]);
        setDoc(docRes.data);
        setVersions(versRes.data.versions || []);
        const v = docRes.data.currentVersion || docRes.data.version;
        publicApi.trackView(slug, v?.versionNumber);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Document not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, requestedVersion]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading document...</p>
      </div>
    </div>
  );

  if (error || !doc) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
  const dynamicUrl = `https://sika-dpp-poc-7x1n.vercel.app/docs/${slug}`;
  const versionUrl = `https://sika-dpp-poc-7x1n.vercel.app/docs/${slug}?v=${version.versionNumber}`;

  return (
    <>
      {showQR && <QRModal url={showQR} onClose={() => setShowQR(null)} />}

      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 text-sm shrink-0">
                &#8592;
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{doc.productCode}</span>
                  <span className="text-sm font-medium text-gray-800 truncate">{doc.productName}</span>
                  {isLatest
                    ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0">latest</span>
                    : <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full shrink-0">archived</span>
                  }
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Mobile info toggle */}
              <button onClick={() => setShowInfo(!showInfo)}
                className="md:hidden text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded font-medium">
                {showInfo ? 'Hide info' : 'Info'}
              </button>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs bg-red-600 text-white px-3 py-1.5 rounded font-medium hover:bg-red-700">
                Download
              </a>
            </div>
          </div>
        </header>

        {/* Archived banner */}
        {!isLatest && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
            <p className="text-xs text-amber-700">Archived version ({version.versionNumber}) — superseded.</p>
            <button onClick={() => router.push(`/docs/${slug}`)}
              className="text-xs bg-amber-600 text-white px-2.5 py-1 rounded font-medium ml-3 shrink-0">
              View latest
            </button>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Mobile info panel — shown when toggled */}
          {showInfo && (
            <div className="md:hidden bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Document info</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Type: </span><span className="text-gray-700">{DOC_TYPE_LABELS[version.documentType || ''] || version.documentType}</span></div>
                  <div><span className="text-gray-400">Language: </span><span className="text-gray-700">{version.language}</span></div>
                  <div><span className="text-gray-400">Version: </span><span className="font-mono text-gray-700">{version.versionNumber}</span></div>
                  <div><span className="text-gray-400">Size: </span><span className="text-gray-700">{formatBytes(version.fileSize)}</span></div>
                </div>
              </div>
              {version.fileHash && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">File Integrity</p>
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">SHA-256</span>
                  </div>
                  <div className="bg-gray-50 rounded px-2 py-1.5 flex items-center justify-between gap-2">
                    <code className="text-xs text-gray-600 truncate">{version.fileHash.slice(0, 20)}…</code>
                    <button onClick={() => copy(version.fileHash!, 'hash')} className="text-xs text-gray-400 shrink-0">
                      {copied === 'hash' ? '✓' : 'copy'}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Stable links</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs text-gray-500">Dynamic (latest)</span>
                      <div className="flex gap-2">
                        <button onClick={() => setShowQR(dynamicUrl)} className="text-xs text-purple-500">QR</button>
                        <button onClick={() => copy(dynamicUrl, 'd')} className="text-xs text-gray-400">{copied === 'd' ? '✓' : 'copy'}</button>
                      </div>
                    </div>
                    <code className="text-xs text-blue-600 block bg-blue-50 rounded px-2 py-1 break-all">/docs/{slug}/latest</code>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs text-gray-500">Version (immutable)</span>
                      <div className="flex gap-2">
                        <button onClick={() => setShowQR(versionUrl)} className="text-xs text-purple-500">QR</button>
                        <button onClick={() => copy(versionUrl, 'v')} className="text-xs text-gray-400">{copied === 'v' ? '✓' : 'copy'}</button>
                      </div>
                    </div>
                    <code className="text-xs text-amber-600 block bg-amber-50 rounded px-2 py-1 break-all">/docs/{slug}/v/{version.versionNumber}</code>
                  </div>
                </div>
              </div>
              {versions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Versions ({versions.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...versions].reverse().map(v => (
                      <button key={v.versionNumber}
                        onClick={() => { setShowInfo(false); v.isLatest ? router.push(`/docs/${slug}`) : router.push(`/docs/${slug}?v=${v.versionNumber}`); }}
                        className={`text-xs px-2.5 py-1 rounded-full border font-mono ${v.versionNumber === version.versionNumber ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}>
                        v{v.versionNumber}{v.isLatest ? ' ●' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Desktop layout */}
          <div className="flex gap-5">
            {/* Desktop sidebar */}
            <aside className="hidden md:block w-64 shrink-0 space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Document info</p>
                <dl className="space-y-2">
                  <div><dt className="text-xs text-gray-400">Type</dt><dd className="text-xs font-medium text-gray-700">{DOC_TYPE_LABELS[version.documentType || ''] || version.documentType || '—'}</dd></div>
                  <div><dt className="text-xs text-gray-400">Language</dt><dd className="text-xs text-gray-700">{version.language || '—'}</dd></div>
                  <div><dt className="text-xs text-gray-400">Version</dt><dd className="text-xs font-mono text-gray-700">{version.versionNumber}</dd></div>
                  <div><dt className="text-xs text-gray-400">File size</dt><dd className="text-xs text-gray-700">{formatBytes(version.fileSize)}</dd></div>
                  <div><dt className="text-xs text-gray-400">Uploaded</dt><dd className="text-xs text-gray-700">{new Date(version.uploadedAt).toLocaleDateString()}</dd></div>
                </dl>
              </div>

              {version.fileHash && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">File Integrity</span>
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">SHA-256</span>
                  </div>
                  <div className="bg-gray-50 rounded px-2 py-2 mb-2">
                    <code className="text-xs text-gray-600 break-all leading-relaxed">{version.fileHash}</code>
                  </div>
                  <button
                    onClick={() => copy(version.fileHash!, 'hash')}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded py-1 hover:bg-gray-50 transition-colors">
                    {copied === 'hash' ? '✓ Copied' : 'Copy hash'}
                  </button>
                  <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                    Verify the downloaded file matches this checksum to confirm authenticity.
                  </p>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Stable links</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 font-medium">Dynamic (latest)</span>
                      <div className="flex gap-2">
                        <button onClick={() => setShowQR(dynamicUrl)} className="text-xs text-purple-500 hover:text-purple-700 font-medium">QR</button>
                        <button onClick={() => copy(dynamicUrl, 'd')} className="text-xs text-gray-400 hover:text-gray-600">{copied === 'd' ? '✓' : 'copy'}</button>
                      </div>
                    </div>
                    <code className="text-xs text-blue-600 break-all block bg-blue-50 rounded px-2 py-1.5">/docs/{slug}/latest</code>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 font-medium">Version (immutable)</span>
                      <div className="flex gap-2">
                        <button onClick={() => setShowQR(versionUrl)} className="text-xs text-purple-500 hover:text-purple-700 font-medium">QR</button>
                        <button onClick={() => copy(versionUrl, 'v')} className="text-xs text-gray-400 hover:text-gray-600">{copied === 'v' ? '✓' : 'copy'}</button>
                      </div>
                    </div>
                    <code className="text-xs text-amber-600 break-all block bg-amber-50 rounded px-2 py-1.5">/docs/{slug}/v/{version.versionNumber}</code>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">QR Code</p>
                <div className="flex flex-col items-center">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(dynamicUrl)}`}
                    alt="QR" className="w-32 h-32 rounded border border-gray-200" />
                  <p className="text-xs text-gray-400 mt-1.5 text-center">Points to latest version</p>
                  <button onClick={() => setShowQR(dynamicUrl)}
                    className="mt-2 w-full text-xs bg-red-600 text-white py-1.5 rounded font-medium hover:bg-red-700">
                    View full size
                  </button>
                </div>
              </div>

              {versions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Version history ({versions.length})</p>
                  <ul className="space-y-1">
                    {[...versions].reverse().map(v => (
                      <li key={v.versionNumber}>
                        <button
                          onClick={() => v.isLatest ? router.push(`/docs/${slug}`) : router.push(`/docs/${slug}?v=${v.versionNumber}`)}
                          className={`w-full text-left flex items-center justify-between text-xs rounded px-2 py-1.5 transition-colors ${v.versionNumber === version.versionNumber ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
                          <span className="font-mono">v{v.versionNumber}</span>
                          <div className="flex items-center gap-1">
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

            {/* PDF viewer — takes full width on mobile */}
            <div className="flex-1 min-w-0">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate">{version.fileName}</span>
                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs bg-red-600 text-white px-3 py-1.5 rounded font-medium hover:bg-red-700 shrink-0 ml-2">
                    Open PDF
                  </a>
                </div>

                {/* PDF render — try iframe first, fallback to Google viewer */}
                {!pdfError ? (
                  <iframe
                    src={pdfProxyUrl}
                    className="w-full"
                    style={{ height: '80vh', minHeight: '400px' }}
                    title={version.fileName}
                    onError={() => setPdfError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: '400px' }}>
                    <div className="text-4xl mb-4">📄</div>
                    <p className="text-gray-600 font-medium mb-2">{version.fileName}</p>
                    <p className="text-gray-400 text-sm mb-6">PDF preview not available in this browser.</p>
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
                      className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 text-sm">
                      Open PDF in new tab
                    </a>
                    <p className="text-xs text-gray-300 mt-4">
                      Or use the Google Docs viewer:
                    </p>
                    <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(downloadUrl)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-500 underline mt-1">
                      View in Google Docs
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function DocPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DocContent />
    </Suspense>
  );
}
