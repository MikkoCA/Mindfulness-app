'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@/components/auth/Auth0Provider';

interface AuthCheckProps {
  children: ReactNode;
}

const AuthCheck = ({ children }: AuthCheckProps) => {
  const { isAuthenticated, loading, login } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login if not authenticated
      login();
    }
  }, [isAuthenticated, loading, router, login]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return <>{children}</>;
};

export default AuthCheck; 