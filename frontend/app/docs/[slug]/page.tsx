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
  links?: Record<string, string>;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading document…</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-sm mb-3">{error || 'Document not found'}</p>
          <button onClick={() => router.push('/')} className="text-xs text-gray-400 underline">
            Back to search
          </button>
        </div>
      </div>
    );
  }

  const version = doc.currentVersion || doc.version!;
  const isLatest = doc.isLatest !== false;

  // Use the frontend proxy to avoid cross-origin iframe issues
  const pdfProxyUrl = `/api/pdf-proxy?slug=${slug}&version=${version.versionNumber}`;
  // Direct download still goes via backend
  const downloadUrl = publicApi.getDownloadUrl(slug, version.versionNumber);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-gray-600 transition-colors text-sm flex items-center gap-1"
            >
              ← Back
            </button>
            <span className="text-gray-200">|</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded shrink-0">
                {doc.productCode}
              </span>
              <h1 className="text-sm font-medium text-gray-800 truncate">{doc.productName}</h1>
              {!isLatest && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
                  archived
                </span>
              )}
              {isLatest && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">
                  latest
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">

        {/* LEFT SIDEBAR */}
        <aside className="col-span-1 space-y-4">

          {/* Document info */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
              Document info
            </p>
            <dl className="space-y-2.5">
              <div>
                <dt className="text-xs text-gray-400">Type</dt>
                <dd className="text-xs font-medium text-gray-700 mt-0.5">
                  {DOC_TYPE_LABELS[version.documentType || ''] || version.documentType || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Language</dt>
                <dd className="text-xs text-gray-700 mt-0.5">{version.language || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Version</dt>
                <dd className="text-xs font-mono text-gray-700 mt-0.5">{version.versionNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">File size</dt>
                <dd className="text-xs text-gray-700 mt-0.5">{formatBytes(version.fileSize)}</dd>
              </div>
              {version.issueDate && (
                <div>
                  <dt className="text-xs text-gray-400">Issue date</dt>
                  <dd className="text-xs text-gray-700 mt-0.5">
                    {new Date(version.issueDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-400">Uploaded</dt>
                <dd className="text-xs text-gray-700 mt-0.5">
                  {new Date(version.uploadedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Stable URLs */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
              Stable links
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 font-medium">Dynamic (always latest)</p>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/docs/${slug}`, 'dynamic')}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    {copied === 'dynamic' ? '✓ copied' : 'copy'}
                  </button>
                </div>
                <code className="text-xs text-blue-600 break-all block bg-blue-50 rounded px-2 py-1.5 leading-relaxed">
                  /docs/{slug}/latest
                </code>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 font-medium">Version-specific (immutable)</p>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/docs/${slug}?v=${version.versionNumber}`, 'version')}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    {copied === 'version' ? '✓ copied' : 'copy'}
                  </button>
                </div>
                <code className="text-xs text-amber-600 break-all block bg-amber-50 rounded px-2 py-1.5 leading-relaxed">
                  /docs/{slug}/v/{version.versionNumber}
                </code>
              </div>
            </div>
          </div>

          {/* Version history */}
          {versions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
                Version history ({versions.length})
              </p>
              <ul className="space-y-1">
                {[...versions].reverse().map((v) => (
                  <li key={v.versionNumber}>
                    <button
                      onClick={() =>
                        v.isLatest
                          ? router.push(`/docs/${slug}`)
                          : router.push(`/docs/${slug}?v=${v.versionNumber}`)
                      }
                      className={`w-full text-left flex items-center justify-between
                                  text-xs rounded px-2.5 py-2 transition-colors
                                  ${v.versionNumber === version.versionNumber
                                    ? 'bg-gray-100 text-gray-900 font-medium'
                                    : 'text-gray-500 hover:bg-gray-50'
                                  }`}
                    >
                      <span className="font-mono">v{v.versionNumber}</span>
                      <div className="flex items-center gap-1.5 text-right">
                        <span className="text-gray-300">
                          {new Date(v.uploadedAt).toLocaleDateString('en', { month: 'short', year: '2-digit' })}
                        </span>
                        {v.isLatest && <span className="text-green-500 text-xs">●</span>}
                        {v.supersededAt && !v.isLatest && (
                          <span className="text-gray-300 text-xs">archived</span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* MAIN: PDF viewer */}
        <div className="col-span-2">
          {/* Archived banner */}
          {!isLatest && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center justify-between">
              <p className="text-sm text-amber-700">
                You are viewing an archived version ({version.versionNumber}).
                This document has been superseded.
              </p>
              <button
                onClick={() => router.push(`/docs/${slug}`)}
                className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded font-medium
                           hover:bg-amber-700 transition-colors ml-4 shrink-0"
              >
                View latest
              </button>
            </div>
          )}

          {/* PDF viewer card */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-red-600 text-sm">📄</span>
                <span className="text-xs text-gray-600 truncate">{version.fileName}</span>
              </div>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-red-600 text-white px-3 py-1.5 rounded font-medium
                           hover:bg-red-700 transition-colors shrink-0 ml-3"
              >
                Download PDF
              </a>
            </div>
            {/* PDF iframe via same-origin proxy — fixes cross-origin block */}
            <iframe
              src={pdfProxyUrl}
              className="w-full"
              style={{ height: '72vh', minHeight: '500px' }}
              title={version.fileName}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
