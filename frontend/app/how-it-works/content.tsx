'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const sections = [
  {
    id: 'overview', icon: '1', color: 'blue', title: 'System Overview',
    content: 'The MoreYeahs Document Repository satisfies EU CPR requirements for public document access. It provides clean separation between the internal EDMS (Optimal Systems / yuuvis-rad) and the public-facing document delivery layer.',
    items: [
      'Admin-only document upload with API key protection',
      'Public access with zero login or registration required',
      'Immutable versioning — documents are never deleted, only superseded',
      'Two stable URL types: dynamic (always latest) and version-specific (immutable)',
      'SHA-256 integrity hash on every PDF — tamper-proof verification',
      'PDF metadata stripping before storage — no internal fields leaked',
      'Full audit log of all admin actions with performer identity',
      'View and download analytics per document',
      'EDMS push webhook for Optimal Systems integration',
    ],
  },
  {
    id: 'urls', icon: '2', color: 'green', title: 'URL Design and 10-Year Stability',
    content: 'URL stability is a core requirement of the EU CPR Digital Product Passports. URLs must remain valid for a minimum of 10 years after publication.',
    items: [
      'Dynamic URL: /docs/{slug}/latest — always resolves to newest published version',
      'Version-specific URL: /docs/{slug}/v/{version} — immutable, cached 1 year',
      'Dynamic URLs use Cache-Control: no-store — never served stale',
      'Slug naming convention: {product-code}--{doc-type}-{language}',
      'Example: sikaflex-221--tds-en, sikatop-107--sds-de',
      'Slugs are lowercase, hyphenated, and never changed after creation',
      'QR codes generated for both URL types — ready for physical product labels',
    ],
  },
  {
    id: 'integrity', icon: '3', color: 'amber', title: 'File Integrity & PDF Metadata Stripping',
    content: 'Every PDF is sanitised and fingerprinted before storage. This guarantees both document authenticity and privacy of internal metadata.',
    items: [
      'On upload: PDF is loaded into memory (not streamed directly to S3)',
      'pdf-lib strips author, title, subject, keywords, producer, creator fields',
      'SHA-256 hash calculated on the stripped buffer — stored per version',
      'Hash exposed in public API responses and shown on every document page',
      'Anyone can verify a downloaded file matches the published hash',
      'If PDF stripping fails (encrypted/corrupt), original buffer is stored safely',
      'File hash also returned in admin upload response for EDMS back-reference',
    ],
  },
  {
    id: 'versioning', icon: '4', color: 'purple', title: 'Versioning System',
    content: 'Built around immutability — a core regulatory requirement. No document version is ever deleted from the system.',
    items: [
      'Each document has a versions array in MongoDB — append only',
      'When a new version is uploaded, old version is marked superseded with timestamp',
      'The dynamic URL automatically serves the newest published version',
      'Old version URLs continue to work forever — regulatory requirement',
      'Version history panel on public page shows all versions with dates',
      'Superseded versions display an archived banner with a link to the latest',
      'Admin can add unlimited versions with free-form version numbers',
    ],
  },
  {
    id: 'api', icon: '5', color: 'teal', title: 'API Reference',
    content: 'The backend exposes three sets of routes: public (no auth), admin (API key), and EDMS integration (API key).',
    items: [
      'GET  /docs?q= — search by product name or code (returns type + language)',
      'GET  /docs/:slug/latest — dynamic URL, newest version, includes fileHash',
      'GET  /docs/:slug/v/:version — immutable version, includes fileHash',
      'GET  /docs/:slug/v/:version/download — signed S3 URL redirect, tracks download',
      'GET  /docs/:slug/versions — full version history',
      'POST /docs/:slug/view — track a page view (called by frontend on load)',
      'POST /admin/documents — create document + first version (API key)',
      'PATCH /admin/documents/:slug/versions — add new version (API key)',
      'PATCH /admin/documents/:slug/publish / archive (API key)',
      'GET  /admin/audit — recent admin actions log (API key)',
      'GET  /admin/analytics — view + download counts per document (API key)',
      'POST /edms/push — webhook for Optimal Systems push signal (API key)',
      'GET  /edms/status/:edmsDocId — check registration status (API key)',
    ],
  },
  {
    id: 'audit', icon: '6', color: 'red', title: 'Audit Log & Analytics',
    content: 'Every admin action is recorded and every public document access is counted. Supports compliance audits without operational burden.',
    items: [
      'AuditLog collection: records create, add_version, publish, archive actions',
      'Each entry stores: action, slug, version, performed-by user, IP, timestamp',
      'Admin dashboard shows last 20 actions with colour-coded badges',
      'Audit log exportable to CSV from the dashboard',
      'Analytics collection: records view and download events per slug/version',
      'Downloads tracked automatically on every signed URL redirect',
      'Views tracked via POST /docs/:slug/view on page load',
      'Admin dashboard shows total views, total downloads, and top 5 documents',
    ],
  },
  {
    id: 'metadata', icon: '7', color: 'rose', title: 'Metadata Handling',
    content: 'Internal metadata is never exposed to public users. Separation is enforced at the API model level, not just UI logic.',
    items: [
      'Public fields: title, language, product category, document type, issue date',
      'Public fields: version number, upload date, file name, file size, SHA-256 hash',
      'Internal only: EDMS Doc ID and Version ID (Optimal Systems reference)',
      'Internal only: uploaded-by username, source system, internal notes',
      'stripInternal() function applied to all public API responses before sending',
      'PDF-level metadata (author, creator, producer) stripped before S3 upload',
    ],
  },
  {
    id: 'edms', icon: '8', color: 'gray', title: 'EDMS Integration',
    content: 'Designed to integrate with the existing EDMS (Optimal Systems / yuuvis-rad) as the external public delivery layer.',
    items: [
      'POST /edms/push — called by Optimal Systems when a document is approved',
      'Receives: EDMS Doc ID, version, slug, product metadata, optional fileUrl',
      'Returns action directive: create_pending or version_pending',
      'Tells EDMS exactly which endpoint to call next for the file upload',
      'GET /edms/status/:edmsDocId — check if document is already registered',
      'Admin panel EDMS Demo tab simulates the full 3-step flow interactively',
      'Generated public URL and SHA-256 hash returned to EDMS for back-storage',
      'In production: EDMS provides temp fileUrl, system auto-downloads and strips metadata',
    ],
  },
  {
    id: 'security', icon: '9', color: 'blue', title: 'Security',
    content: 'Admin operations are protected while public access remains open and fast.',
    items: [
      'Admin API protected by x-api-key header — replace with Entra ID SSO for production',
      'x-admin-user header identifies the performer for audit log entries',
      'Public endpoints rate-limited: 200 requests per 15 minutes per IP',
      'Helmet.js sets security headers (XSS, CSRF, content-type sniffing)',
      'PDF files served via signed S3 URLs — storage bucket is never public',
      'File upload restricted to PDF MIME type only, max 50 MB',
      'No personal user data stored — GDPR-friendly for public access',
      'EU data residency: AWS S3 eu-central-1 (Frankfurt)',
    ],
  },
  {
    id: 'production', icon: '10', color: 'green', title: 'Production Checklist',
    content: 'Remaining items before go-live in a production-grade environment.',
    items: [
      'Replace API key auth with Microsoft Entra ID SSO for admin users',
      'Enable S3 Object Lock for regulatory immutability guarantee (WORM storage)',
      'Add PDF/A format validation on upload for long-term readability',
      'Implement DOI/PURL persistent identifier layer to prevent link-rot',
      'Build full EDMS auto-download pipeline (currently requires manual file upload)',
      'Set up 99.99% uptime SLA monitoring and alerting',
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">MoreYeahs Document Repository</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto mb-4">
              Complete technical reference - architecture, features, API, URL design, security and production checklist.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">EU CPR Compliant</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">POC v2.0</span>
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
            MoreYeahs Document Repository - POC v1.0 - Built for EU CPR Compliance
          </div>
        </div>
      </main>
    </>
  );
}
