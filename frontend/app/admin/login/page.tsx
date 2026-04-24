'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

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
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">MoreYeahs</h1>
          <p className="text-sm text-gray-400 mt-1">Document Repository — Admin</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h2 className="text-base font-semibold text-gray-800 mb-6">Sign in</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Username</label>
              <input
                ref={userRef}
                type="text"
                autoComplete="username"
                placeholder="Enter username"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Password</label>
              <input
                ref={passRef}
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-300 mt-6">MoreYeahs Document Repository · Admin Access</p>
      </div>
    </main>
  );
}
