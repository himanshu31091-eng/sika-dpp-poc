'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const sections = [
  {
    id: 'overview', icon: '1', color: 'blue', title: 'System Overview',
    content: 'The OXDX Public Document Repository satisfies Healthcare Document Compliance (ISO 13485) requirements for public document access. It provides clean separation between internal EDMS (Optimal Systems) and the public-facing document delivery layer.',
    items: [
      'Admin-only document upload with API key protection',
      'Public access with zero login or registration required',
      'Versioning system - documents are never deleted, only superseded',
      'Two stable URL types: dynamic (always latest) and version-specific (immutable)',
      'Full audit trail of all versions with timestamps',
      'PDF inline viewer with download option',
      'EDMS webhook integration stub for Optimal Systems push events',
    ],
  },
  {
    id: 'urls', icon: '2', color: 'green', title: 'URL Design and 10-Year Stability',
    content: 'URL stability is the core requirement of the ISO 13485 Medical Device Documentation. URLs must remain valid for a minimum of 10 years after publication.',
    items: [
      'Dynamic URL format: /docs/{slug}/latest - always resolves to newest version',
      'Version-specific URL: /docs/{slug}/v/{version} - immutable forever',
      'Dynamic URLs use Cache-Control: no-store - never cached',
      'Version URLs use Cache-Control: immutable - 1 year browser cache',
      'Slug naming: {product-code}--{doc-type}-{language}',
      'Example: oxdxflex-221--tds-en, oxdx-top-122--sds-de',
      'Slugs are lowercase, hyphenated, never changed after creation',
    ],
  },
  {
    id: 'versioning', icon: '3', color: 'amber', title: 'Versioning System',
    content: 'Built around immutability - a core regulatory requirement. No document version is ever deleted from the system.',
    items: [
      'Each document has a versions array in MongoDB - append only',
      'When new version uploaded, old version marked superseded with timestamp',
      'The dynamic URL automatically serves the newest version',
      'Old version URLs continue to work forever',
      'Version history panel shows all versions with dates and status',
      'Admin can add unlimited versions with free-form version numbers',
      'Superseded versions show an archived banner on the public page',
    ],
  },
  {
    id: 'api', icon: '4', color: 'purple', title: 'API Reference',
    content: 'The backend exposes two sets of routes - public (no auth) and admin (API key required).',
    items: [
      'GET  /docs?q=query - search documents by device code or name',
      'GET  /docs/:slug/latest - dynamic URL, always newest (no auth)',
      'GET  /docs/:slug/v/:version - immutable version URL (no auth)',
      'GET  /docs/:slug/v/:version/download - serve PDF file (no auth)',
      'GET  /docs/:slug/versions - full version history (no auth)',
      'POST /admin/documents - create document + first version (API key)',
      'PATCH /admin/documents/:slug/versions - add new version (API key)',
      'PATCH /admin/documents/:slug/publish - publish document (API key)',
      'POST /edms/push - webhook for Optimal Systems integration (API key)',
    ],
  },
  {
    id: 'document-types', icon: '5', color: 'teal', title: 'Supported Document Types',
    content: 'All document types required by the ISO 13485 Medical Device Documentation specification are supported.',
    items: [
      'DoPC - Declaration of Performance and Conformity',
      'SDS - Safety Data Sheet',
      'TDS - Technical Data Sheet',
      'Label - Product Label (all language versions)',
      'Technical - Technical Documentation and test reports',
      'Other - Any other relevant documentation',
    ],
  },
  {
    id: 'metadata', icon: '6', color: 'red', title: 'Metadata Handling',
    content: 'Internal OXDX metadata is never exposed to public users. Separation is enforced at the API model level.',
    items: [
      'Public: document title, language, product category, document type',
      'Public: issue date, version number, upload date, file name and size',
      'Internal only: EDMS document ID and version ID (Optimal Systems reference)',
      'Internal only: uploaded by, source system, internal notes',
      'Internal metadata fields are never serialized in public API responses',
      'Separation is at model level - not just UI logic',
    ],
  },
  {
    id: 'security', icon: '7', color: 'rose', title: 'Security',
    content: 'Admin operations are protected while public access remains open and fast.',
    items: [
      'Admin API protected by API key header (x-api-key)',
      'Replace with Microsoft Entra ID SSO for production',
      'Public endpoints rate-limited: 200 requests per 15 minutes per IP',
      'Helmet.js sets security headers (XSS, CSRF, content-type protection)',
      'CORS restricted to frontend origin only',
      'PDF files served via proxy - storage bucket is never public',
      'File upload restricted to PDF MIME type only, max 50MB',
      'No user data stored - GDPR friendly for public users',
    ],
  },
  {
    id: 'edms', icon: '8', color: 'gray', title: 'EDMS Integration',
    content: 'Designed to integrate with OXDX\'s existing EDMS (Optimal Systems / yuuvis-rad) as the external-facing public layer.',
    items: [
      'POST /edms/push - webhook called by Optimal Systems when doc is approved',
      'Receives: EDMS Doc ID, version number, slug, product metadata',
      'Returns correct admin endpoint to complete the file upload',
      'GET /edms/status/:edmsDocId - check if document is registered',
      'In production: EDMS provides temp download URL, system strips metadata and stores',
      'Generated public URL is returned to EDMS for storage in document metadata',
      'Clear separation: EDMS handles internal workflow, this system handles public delivery',
    ],
  },
  {
    id: 'production', icon: '9', color: 'green', title: 'Production Checklist',
    content: 'Items required before going live in production.',
    items: [
      'Replace API key auth with Microsoft Entra ID SSO',
      'Switch local disk storage to AWS S3 EU region for GDPR compliance',
      'Enable S3 Object Lock for regulatory immutability guarantee',
      'Set up 99.9% uptime SLA on cloud hosting (Azure or AWS)',
      'Add PDF/A format validation on upload for long-term readability',
      'Implement DOI/PURL persistent identifier layer for link-rot prevention',
      'Build full EDMS metadata sync pipeline with Optimal Systems',
      'Add audit log collection for all admin actions',
      'Security penetration testing before go-live',
    ],
  },
];

const colorMap: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-800 border-blue-200',
  green:  'bg-green-100 text-green-800 border-green-200',
  amber:  'bg-amber-100 text-amber-800 border-amber-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  teal:   'bg-teal-100 text-teal-800 border-teal-200',
  red:    'bg-red-100 text-red-800 border-red-200',
  rose:   'bg-rose-100 text-rose-800 border-rose-200',
  gray:   'bg-gray-100 text-gray-800 border-gray-200',
};

export default function HowItWorksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('print') === '1') {
      setTimeout(() => window.print(), 800);
    }
  }, [searchParams]);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 12px; }
        }
      `}</style>
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 shadow-sm no-print">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600 text-sm">
                Back to Admin
              </button>
              <span className="text-gray-200">|</span>
              <h1 className="text-base font-semibold text-gray-900">How It Works</h1>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Download PDF
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">S</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">OXDX Public Document Repository</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto mb-4">
              Complete technical reference - architecture, features, API, URL design, security and production checklist.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ISO 13485 Compliant</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">POC v1.0</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">Next.js + Node.js + MongoDB</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 no-print">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contents</p>
            <div className="grid grid-cols-2 gap-1">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`}
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-red-600 px-2 py-1.5 rounded hover:bg-gray-50 transition-colors">
                  <span className="w-5 h-5 bg-gray-100 rounded text-center text-gray-500 font-mono shrink-0 leading-5">{s.icon}</span>
                  <span>{s.title}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {sections.map((section) => {
              const c = colorMap[section.color] || colorMap.gray;
              return (
                <div key={section.id} id={section.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${c}`}>
                      {section.icon}
                    </span>
                    <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">{section.content}</p>
                  <ul className="space-y-1.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-red-400 mt-1 shrink-0 font-bold text-xs">-</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center text-xs text-gray-400 pb-8 no-print">
            OXDX Public Document Repository - POC v1.0 - Built for ISO 13485 Compliance
          </div>
        </div>
      </main>
    </>
  );
}
