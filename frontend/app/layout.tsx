import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sika Public Document Repository',
  description: 'Technical documentation and Digital Product Passports — EU CPR Compliant',
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
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-sika-red rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold leading-none">S</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">MoreYeahs Document Repository</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-300">
              <span>EU CPR Compliant</span>
              <span>·</span>
              <span>SHA-256 Verified</span>
              <span>·</span>
              <span>10-Year URL Stability</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
