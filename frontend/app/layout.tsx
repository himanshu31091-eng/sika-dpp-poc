import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OXDX Public Document Repository',
  description: 'Regulatory documentation and Medical Device Documentation — EU Regulation Compliant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <footer className="border-t border-gray-200 bg-white mt-12">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-gray-400">
            <span>OXDX Healthcare — Public Document Repository</span>
            <span>Healthcare Document Compliance Compliant</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
