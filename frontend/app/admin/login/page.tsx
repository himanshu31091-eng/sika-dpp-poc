'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SikaLogo } from '@/components/SikaLogo';

const USERS: Record<string, string> = {
  himanshu: 'moreyeahs@2026',
  vincenzo: 'sika@2026',
};

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const username = userRef.current?.value?.trim().toLowerCase() || '';
    const password = passRef.current?.value || '';
    setTimeout(() => {
      if (USERS[username] && USERS[username] === password) {
        localStorage.setItem('admin_user', username);
        localStorage.setItem('admin_auth', 'true');
        router.push('/admin');
      } else {
        setError('Invalid username or password.');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#f5f5f5' }}>

      {/* ── Sika yellow diagonal header ── */}
      <header className="relative overflow-hidden" style={{ background: '#ffc510', minHeight: 72 }}>
        {/* Gray right panel */}
        <div
          className="hidden sm:block absolute inset-y-0 right-0"
          style={{ background: '#e8e8e8', left: '52%', clipPath: 'polygon(46px 0, 100% 0, 100% 100%, 0 100%)' }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SikaLogo size={48} />
            <div className="hidden sm:block">
              <h1
                className="text-sm font-bold text-gray-900 uppercase"
                style={{ fontFamily: '"Barlow Condensed", Barlow, sans-serif', letterSpacing: '0.08em' }}
              >
                Document Repository
              </h1>
              <p className="text-xs text-gray-700">Admin Portal</p>
            </div>
          </div>
          <a href="/"
            className="text-xs font-medium px-3 py-1.5 rounded transition-colors"
            style={{ background: 'rgba(255,255,255,0.7)', color: '#1a1a1a' }}>
            ← Public Site
          </a>
        </div>
      </header>

      {/* ── Login form centred in remaining space ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Sika logo + Group */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <SikaLogo size={80} showGroup />
            </div>
            <p className="text-xs mt-3" style={{ color: '#616161', fontFamily: '"Barlow", sans-serif' }}>
              Restricted to authorised Sika personnel
            </p>
          </div>

          {/* Card */}
          <div className="bg-white shadow-card-md overflow-hidden" style={{ borderRadius: 2 }}>
            {/* Yellow top stripe matching header */}
            <div style={{ height: 4, background: '#ffc510' }} />

            <div className="px-6 py-6">
              <h2
                className="text-base font-bold uppercase mb-5"
                style={{ fontFamily: '"Barlow Condensed", Barlow, sans-serif', letterSpacing: '0.08em', color: '#1a1a1a' }}
              >
                Sign In
              </h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                    style={{ fontFamily: '"Barlow Condensed", sans-serif', color: '#616161', letterSpacing: '0.08em' }}
                  >
                    Username
                  </label>
                  <input
                    ref={userRef}
                    type="text"
                    autoComplete="username"
                    placeholder="Enter username"
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none transition-shadow"
                    style={{ borderRadius: 2, fontFamily: '"Barlow", sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = '#ffc510'; e.target.style.boxShadow = '0 0 0 3px rgba(255,197,16,0.2)'; }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                    style={{ fontFamily: '"Barlow Condensed", sans-serif', color: '#616161', letterSpacing: '0.08em' }}
                  >
                    Password
                  </label>
                  <input
                    ref={passRef}
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none transition-shadow"
                    style={{ borderRadius: 2, fontFamily: '"Barlow", sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = '#ffc510'; e.target.style.boxShadow = '0 0 0 3px rgba(255,197,16,0.2)'; }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {error && (
                  <p className="text-xs bg-red-50 border border-red-100 px-3 py-2 flex items-center gap-1.5" style={{ color: '#C8102E', borderRadius: 2 }}>
                    <span>⚠</span> {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-press w-full text-white py-2.5 text-sm font-bold disabled:opacity-50 transition-colors duration-200 uppercase tracking-wider"
                  style={{ background: '#C8102E', borderRadius: 2, fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.08em' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in…
                    </span>
                  ) : 'Sign In'}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: '#b0b0b0' }}>
            Sika Document Repository · POC v2.0 · Admin Access
          </p>
        </div>
      </div>
    </main>
  );
}
