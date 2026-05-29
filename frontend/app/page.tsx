'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { publicApi } from '@/lib/api';

interface DocResult {
  slug: string;
  productCode: string;
  productName: string;
  latestVersion: string;
  documentType: string;
  language: string;
  updatedAt: string;
  dynamicUrl: string;
}

const DOC_TYPE_COLORS: Record<string, string> = {
  DoPC:      'bg-red-100 text-red-700',
  SDS:       'bg-orange-100 text-orange-700',
  TDS:       'bg-blue-100 text-blue-700',
  Label:     'bg-purple-100 text-purple-700',
  Technical: 'bg-teal-100 text-teal-700',
  Other:     'bg-gray-100 text-gray-600',
};

const DOC_TYPES = ['DoPC', 'SDS', 'TDS', 'Label', 'Technical', 'Other'];
const LANGUAGES = ['EN', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'PT'];

export default function HomePage() {
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<DocResult[]>([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const router = useRouter();

  const search = async (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : query;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await publicApi.search(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply client-side filters on top of text search results
  const filtered = useMemo(() => {
    return results.filter(doc => {
      if (filterType && doc.documentType !== filterType) return false;
      if (filterLang && doc.language !== filterLang) return false;
      return true;
    });
  }, [results, filterType, filterLang]);

  const handleFilterType = (t: string) => {
    const next = filterType === t ? '' : t;
    setFilterType(next);
    if (!searched) search('');
  };

  const handleFilterLang = (l: string) => {
    const next = filterLang === l ? '' : l;
    setFilterLang(next);
    if (!searched) search('');
  };

  const activeFilters = [
    filterType && { label: filterType, clear: () => setFilterType('') },
    filterLang && { label: filterLang, clear: () => setFilterLang('') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

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
                MoreYeahs Document Repository
              </h1>
              <p className="text-xs text-gray-400">Digital Product Passports &amp; Technical Documentation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">EU CPR Compliant</span>
            <a href="/admin" className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 border border-gray-200 rounded-lg transition-colors">
              Admin
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero search */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-3">Find technical documentation</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-lg mx-auto">
            Access safety data sheets, technical documentation, declarations of performance and conformity.
            All documents are publicly available — no account required.
          </p>
          <div className="flex gap-2 max-w-xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Product name or code…"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
            />
            <button onClick={() => search()} disabled={loading}
              className="bg-red-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm">
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium shrink-0">Doc type:</span>
            {DOC_TYPES.map(t => (
              <button key={t} onClick={() => handleFilterType(t)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                  filterType === t
                    ? `${DOC_TYPE_COLORS[t] || 'bg-gray-100 text-gray-600'} border-transparent`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium shrink-0">Language:</span>
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => handleFilterLang(l)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                  filterLang === l
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-400">Active:</span>
            {activeFilters.map(f => (
              <button key={f.label} onClick={f.clear}
                className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full hover:bg-red-100 flex items-center gap-1">
                {f.label} <span className="text-red-400">×</span>
              </button>
            ))}
            <button onClick={() => { setFilterType(''); setFilterLang(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline">
              Clear all
            </button>
          </div>
        )}

        {/* Results */}
        {searched && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filtered.length > 0 ? (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
                  {filtered.length} document{filtered.length !== 1 ? 's' : ''}
                  {activeFilters.length > 0 ? ` matching filters` : ' found'}
                </p>
                <div className="space-y-2">
                  {filtered.map(doc => (
                    <div key={doc.slug} onClick={() => router.push(`/docs/${doc.slug}`)}
                      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-red-400 hover:shadow-sm transition-all group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{doc.productCode}</span>
                            {doc.documentType && (
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${DOC_TYPE_COLORS[doc.documentType] || DOC_TYPE_COLORS.Other}`}>
                                {doc.documentType}
                              </span>
                            )}
                            {doc.language && (
                              <span className="text-xs px-2 py-0.5 rounded font-medium bg-gray-100 text-gray-500">{doc.language}</span>
                            )}
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 group-hover:text-red-700 transition-colors">{doc.productName}</h3>
                          <p className="text-xs text-blue-500 font-mono mt-1">/docs/{doc.slug}/latest</p>
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
            ) : (
              <div className="text-center text-gray-400 text-sm py-12">
                <p className="text-2xl mb-2">📄</p>
                <p>No documents found{query ? ` for "${query}"` : ''}{activeFilters.length > 0 ? ' with selected filters' : ''}</p>
                {activeFilters.length > 0 && (
                  <button onClick={() => { setFilterType(''); setFilterLang(''); }}
                    className="mt-2 text-xs text-red-500 underline">Clear filters</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info tiles — shown before first search */}
        {!searched && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { icon: '🔗', title: 'Stable URLs', desc: '10+ year URL persistence for EU CPR compliance' },
              { icon: '🔒', title: 'SHA-256 verified', desc: 'Every PDF has an integrity hash — tamper-proof' },
              { icon: '📋', title: 'No login required', desc: 'Full public access, no account or registration' },
            ].map(t => (
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
