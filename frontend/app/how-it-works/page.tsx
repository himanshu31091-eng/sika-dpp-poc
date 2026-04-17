import { Suspense } from 'react';
import HowItWorksContent from './content';

export default function HowItWorksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">Loading...</p></div>}>
      <HowItWorksContent />
    </Suspense>
  );
}
