import { Suspense } from 'react';
import VerificationContent from '@/components/auth/VerificationContent';

export const metadata = {
  title: 'Verify Your Email'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function VerificationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div>Loading...</div>}>
        <VerificationContent />
      </Suspense>
    </div>
  );
} 