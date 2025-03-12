'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth0 } from '@/components/auth/Auth0Provider';

// Component that uses useSearchParams must be wrapped in Suspense
function LoginContent() {
  const { login, isAuthenticated } = useAuth0();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // If there's a code parameter, Auth0 has redirected back after authentication
    const code = searchParams.get('code');
    
    if (!code && !isAuthenticated) {
      // Redirect to Auth0 login if not authenticated and no code
      login();
    } else if (code) {
      // Handle the code exchange with Auth0 (typically done on the server)
      // For now, we'll just assume authentication was successful
      window.location.href = '/';
    }
  }, [login, isAuthenticated, searchParams]);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Logging in...</h2>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">
        Redirecting to secure login page. Please wait...
      </p>
    </div>
  );
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Loading...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
} 