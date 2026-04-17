import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sika Public Document Repository',
  description: 'Technical documentation and Digital Product Passports — EU Regulation Compliant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <footer className="border-t border-gray-200 bg-white mt-12">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-gray-400">
            <span>Sika AG — Public Document Repository</span>
            <span>EU Construction Products Regulation Compliant</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
