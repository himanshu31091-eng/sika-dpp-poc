'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { publicApi } from '@/lib/api';

interface DocResult {
  slug: string;
  productCode: string;
  productName: string;
  latestVersion: string;
  documentType: string;
  updatedAt: string;
  dynamicUrl: string;
}

const DOC_TYPE_COLORS: Record<string, string> = {
  DoPC: 'bg-red-100 text-red-700',
  SDS:  'bg-orange-100 text-orange-700',
  TDS:  'bg-blue-100 text-blue-700',
  Label:'bg-purple-100 text-purple-700',
  Technical: 'bg-teal-100 text-teal-700',
  Other:'bg-gray-100 text-gray-600',
};

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await publicApi.search(query);
      setResults(data);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900 leading-tight">
                OXDX Public Document Repository
              </h1>
              <p className="text-xs text-gray-400">Medical Device Documentation &amp; Technical Documentation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              ISO 13485 Compliant
            </span>
            <a
              href="/admin"
              className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 border border-gray-200 rounded-lg transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero search */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-gray-800 mb-3">
            Find regulatory documentation
          </h2>
          <p className="text-gray-500 text-sm mb-8 max-w-lg mx-auto">
            Access safety data sheets, technical documentation, declarations of
            performance and conformity. All documents are publicly available — no
            account required.
          </p>
          <div className="flex gap-2 max-w-xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="e.g. OXDXFlex-221, SDS, device code..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                         shadow-sm"
            />
            <button
              onClick={search}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-3 rounded-lg text-sm font-medium
                         hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
              {results.length} document{results.length !== 1 ? 's' : ''} found
            </p>
            <div className="space-y-2">
              {results.map((doc) => (
                <div
                  key={doc.slug}
                  onClick={() => router.push(`/docs/${doc.slug}`)}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer
                             hover:border-red-400 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {doc.productCode}
                        </span>
                        {doc.documentType && (
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${DOC_TYPE_COLORS[doc.documentType] || DOC_TYPE_COLORS.Other}`}>
                            {doc.documentType}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-red-700 transition-colors">
                        {doc.productName}
                      </h3>
                      <p className="text-xs text-blue-500 font-mono mt-1">
                        /docs/{doc.slug}/latest
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-400 shrink-0">
                      <div className="font-medium text-gray-600">v{doc.latestVersion}</div>
                      <div>{new Date(doc.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searched && results.length === 0 && !loading && (
          <div className="text-center text-gray-400 text-sm py-12">
            <p className="text-2xl mb-2">📄</p>
            <p>No documents found for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {/* Info tiles */}
        {!searched && (
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: '🔗', title: 'Stable URLs', desc: '10+ year URL persistence for MDD compliance' },
              { icon: '📋', title: 'Version history', desc: 'Full audit trail — no documents ever deleted' },
              { icon: '🔒', title: 'No login required', desc: 'Public access with no account or registration' },
            ].map((t) => (
              <div key={t.title} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">{t.icon}</div>
                <h3 className="text-xs font-semibold text-gray-700 mb-1">{t.title}</h3>
                <p className="text-xs text-gray-400">{t.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
