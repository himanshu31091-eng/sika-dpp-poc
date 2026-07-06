import type { Metadata } from 'next';
import './globals.css';
import { SikaLogo } from '@/components/SikaLogo';

export const metadata: Metadata = {
  title: 'Sika Document Repository — Digital Product Passports',
  description: 'Sika official technical documentation and Digital Product Passports — EU CPR Compliant',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Barlow — Klavika substitute for UI; Lobster — script match for Sika wordmark in logo */}
        <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800&family=Lobster&display=swap" rel="stylesheet" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <footer className="bg-white mt-16">
          {/* Sika yellow top strip — matches sika.com --primary */}
          <div className="h-1.5" style={{ background: '#ffc510' }} />
          <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SikaLogo size={44} />
              <div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">Document Repository</p>
                <p className="text-xs text-gray-400">Digital Product Passports &amp; Technical Documentation</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: '#7a5500' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ffc510' }} />
                EU CPR Compliant
              </span>
              <span className="text-gray-200">·</span>
              <span>SHA-256 Verified</span>
              <span className="text-gray-200">·</span>
              <span>10-Year URL Stability</span>
              <span className="text-gray-200">·</span>
              <span>© 2026 Sika Group</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
