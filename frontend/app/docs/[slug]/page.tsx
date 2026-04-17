import { Suspense } from 'react';
import DocContent from './content';

export default function DocPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-gray-400 text-sm">Loading...</p></div></div>}>
      <DocContent />
    </Suspense>
  );
}
