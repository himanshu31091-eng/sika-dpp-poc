import type { Metadata } from 'next';
import './globals.css';
import { SikaLogo } from '@/components/SikaLogo';

export const metadata: Metadata = {
  title: 'Sika Document Repository — Digital Product Passports',
  description: 'Sika official technical documentation and Digital Product Passports — EU CPR Compliant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <footer className="border-t border-gray-100 bg-white mt-16">
          <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SikaLogo width={52} />
              <div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">Document Repository</p>
                <p className="text-xs text-gray-400">Digital Product Passports &amp; Technical Documentation</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-300">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                EU CPR Compliant
              </span>
              <span>·</span>
              <span>SHA-256 Verified</span>
              <span>·</span>
              <span>10-Year URL Stability</span>
              <span>·</span>
              <span className="text-gray-200">© 2026 Sika Group</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
