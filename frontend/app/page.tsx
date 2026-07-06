'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { SikaLogo } from '@/components/SikaLogo';

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

const TYPE_STYLES: Record<string, { badge: string; dot: string }> = {
  DoPC:      { badge: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-500' },
  SDS:       { badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  TDS:       { badge: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500' },
  Label:     { badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  Technical: { badge: 'bg-teal-50 text-teal-700 border-teal-200',    dot: 'bg-teal-500' },
  Other:     { badge: 'bg-gray-100 text-gray-600 border-gray-200',   dot: 'bg-gray-400' },
};

const DOC_TYPES = ['DoPC', 'SDS', 'TDS', 'Label', 'Technical'];
const LANGUAGES = ['EN', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'PT'];

const FEATURES = [
  { icon: '🔗', title: 'Stable URLs', desc: '10+ year URL persistence for EU CPR compliance', accent: '#ffc510' },
  { icon: '🔐', title: 'SHA-256 Verified', desc: 'Every PDF has a cryptographic integrity hash', accent: '#3982b1' },
  { icon: '📋', title: 'Version history', desc: 'Full audit trail — nothing ever deleted', accent: '#52a398' },
  { icon: '🌍', title: 'No login required', desc: 'Fully public access, no account needed', accent: '#C8102E' },
];

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton h-5 w-20" />
        <div className="skeleton h-5 w-12" />
      </div>
      <div className="skeleton h-4 w-3/4 mb-2" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  );
}

export default function HomePage() {
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<DocResult[]>([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [focused, setFocused]       = useState(false);
  const router = useRouter();

  const doSearch = async (q: string) => {
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

  const filtered = useMemo(() => results.filter(d => {
    if (filterType && d.documentType !== filterType) return false;
    if (filterLang && d.language !== filterLang) return false;
    return true;
  }), [results, filterType, filterLang]);

  const handleFilterType = (t: string) => {
    const next = filterType === t ? '' : t;
    setFilterType(next);
    if (!searched) doSearch('');
  };

  const handleFilterLang = (l: string) => {
    const next = filterLang === l ? '' : l;
    setFilterLang(next);
    if (!searched) doSearch('');
  };

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-card">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SikaLogo width={64} />
            <div className="hidden sm:block border-l border-gray-200 pl-3">
              <h1 className="text-sm font-semibold text-gray-900 leading-tight">Document Repository</h1>
              <p className="text-xs text-gray-400">Digital Product Passports &amp; Technical Documentation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border" style={{ background: '#fff9e6', color: '#7a5500', borderColor: '#ffc510' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ffc510' }} />
              EU CPR Compliant
            </span>
            <a href="/admin" className="text-xs text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg font-medium hover:border-gray-400 transition-all duration-200">
              Admin →
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#0f172a]">
        {/* grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* red glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sika-red rounded-full opacity-[0.08] blur-[80px]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/70 text-xs px-3 py-1.5 rounded-full mb-6 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ffc510' }} />
            Public repository · No login required
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight animate-slide-up">
            Sika product<br />
            <span className="gradient-text">documentation</span>
          </h2>
          <p className="text-white/50 text-sm sm:text-base mb-10 max-w-md mx-auto animate-slide-up" style={{ animationDelay: '80ms' }}>
            Safety data sheets, declarations of performance, technical guides —
            all SHA-256 verified and EU CPR compliant.
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '140ms' }}>
            <div className={`flex gap-0 bg-white rounded-xl overflow-hidden transition-all duration-300 ${focused ? 'shadow-[0_0_0_3px_rgba(204,0,0,0.35),0_8px_32px_rgba(0,0,0,0.3)]' : 'shadow-[0_4px_24px_rgba(0,0,0,0.25)]'}`}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch(query)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search by product name or code…"
                className="flex-1 px-5 py-4 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent font-medium"
              />
              <button
                onClick={() => doSearch(query)}
                disabled={loading}
                className="btn-press bg-sika-red hover:bg-sika-red-dark text-white px-7 py-4 text-sm font-semibold transition-colors duration-200 disabled:opacity-60 flex items-center gap-2 shrink-0">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <span>Search</span>
                }
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Filters ── */}
      <div className="bg-white border-b border-gray-100 shadow-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium w-20 shrink-0">Doc type</span>
            {DOC_TYPES.map(t => {
              const s = TYPE_STYLES[t] || TYPE_STYLES.Other;
              const active = filterType === t;
              return (
                <button key={t} onClick={() => handleFilterType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-200 btn-press ${
                    active ? `${s.badge} shadow-sm scale-105` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  {active && <span className={`inline-block w-1.5 h-1.5 ${s.dot} rounded-full mr-1.5`} />}
                  {t}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium w-20 shrink-0">Language</span>
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => handleFilterLang(l)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-200 btn-press ${
                  filterLang === l
                    ? 'bg-slate-800 text-white border-slate-800 scale-105'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}>
                {l}
              </button>
            ))}
            {(filterType || filterLang) && (
              <button onClick={() => { setFilterType(''); setFilterLang(''); }}
                className="text-xs text-sika-red hover:text-sika-red-dark underline font-medium transition-colors duration-200">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Results ── */}
        {searched && (
          <div className="animate-slide-up">
            {loading ? (
              <div className="space-y-3 stagger">
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    {(filterType || filterLang) ? ' · filtered' : ''}
                  </p>
                </div>
                <div className="space-y-2.5 stagger">
                  {filtered.map(doc => {
                    const s = TYPE_STYLES[doc.documentType] || TYPE_STYLES.Other;
                    return (
                      <div key={doc.slug}
                        onClick={() => router.push(`/docs/${doc.slug}`)}
                        className="card-hover bg-white border border-gray-100 rounded-xl p-4 cursor-pointer shadow-card animate-slide-up group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs font-mono text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded font-medium">
                                {doc.productCode}
                              </span>
                              {doc.documentType && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.badge}`}>
                                  {doc.documentType}
                                </span>
                              )}
                              {doc.language && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                                  {doc.language}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold text-gray-800 group-hover:text-sika-red transition-colors duration-200">
                              {doc.productName}
                            </h3>
                            <p className="text-xs text-blue-400 font-mono mt-1 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                              /docs/{doc.slug}/latest
                            </p>
                          </div>
                          <div className="text-right text-xs shrink-0">
                            <div className="font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg font-mono">
                              v{doc.latestVersion}
                            </div>
                            <div className="text-gray-400 mt-1">{new Date(doc.updatedAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        {/* hover arrow */}
                        <div className="mt-2 flex items-center gap-1 text-xs text-sika-red font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-0 group-hover:translate-x-1">
                          View document →
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-20 animate-fade-in">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-700 font-semibold mb-1">No documents found</p>
                <p className="text-sm text-gray-400">
                  {query ? `No results for "${query}"` : 'No documents match the selected filters'}
                </p>
                {(filterType || filterLang) && (
                  <button onClick={() => { setFilterType(''); setFilterLang(''); }}
                    className="mt-4 text-sm text-sika-red underline">Clear filters</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Feature tiles ── */}
        {!searched && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up stagger mt-6">
            {FEATURES.map(f => (
              <div key={f.title}
                className="card-hover bg-white border border-gray-100 rounded-xl p-5 text-center shadow-card overflow-hidden relative">
                {/* Sika color accent bar at top */}
                <div className="absolute top-0 inset-x-0 h-1" style={{ background: f.accent }} />
                <div className="text-3xl mb-3 mt-1">{f.icon}</div>
                <h3 className="text-xs font-semibold text-gray-800 mb-1 font-condensed">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
