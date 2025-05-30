import LoginForm from '@/components/auth/LoginForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Login'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
} 