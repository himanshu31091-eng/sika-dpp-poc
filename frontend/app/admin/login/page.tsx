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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Sika red top bar */}
      <div className="fixed top-0 inset-x-0 h-1 bg-sika-red" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <SikaLogo width={88} showGroup />
          </div>
          <p className="text-sm text-gray-500 mt-2 font-medium">Document Repository</p>
          <p className="text-xs text-gray-400 mt-0.5">Admin Portal</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Red accent header strip */}
          <div className="bg-sika-red px-6 py-4">
            <h2 className="text-sm font-semibold text-white">Administrator Sign In</h2>
            <p className="text-xs text-white/70 mt-0.5">Access restricted to authorised Sika personnel</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Username</label>
                <input
                  ref={userRef}
                  type="text"
                  autoComplete="username"
                  placeholder="Enter username"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-sika-red focus:border-sika-red focus:outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Password</label>
                <input
                  ref={passRef}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-sika-red focus:border-sika-red focus:outline-none transition-shadow"
                />
              </div>
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg flex items-center gap-1.5">
                  <span>⚠</span> {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-press w-full bg-sika-red hover:bg-sika-red-dark text-white py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          Sika Document Repository · Admin Access · POC v2.0
        </p>
        <p className="text-center text-xs text-gray-300 mt-1">
          <a href="/" className="hover:text-gray-400 transition-colors">← View public repository</a>
        </p>
      </div>
    </main>
  );
}
