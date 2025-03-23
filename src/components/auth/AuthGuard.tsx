'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * AuthGuard component to protect routes that require authentication
 * 
 * @param children The content to render when authenticated
 * @param fallback Optional custom fallback to show when not authenticated
 */
export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check localStorage first for authentication state
    const storedAuthState = localStorage.getItem('auth_state');
    const storedAuthExpiration = localStorage.getItem('auth_expiration');
    
    // If we have stored auth state and it hasn't expired
    if (storedAuthState === 'authenticated' && storedAuthExpiration) {
      const expirationTime = parseInt(storedAuthExpiration, 10);
      const currentTime = Date.now();
      
      // Check if the authentication is still valid
      if (currentTime < expirationTime) {
        setIsAuthenticated(true);
      } else {
        // Clear expired authentication
        localStorage.removeItem('auth_state');
        localStorage.removeItem('auth_time');
        localStorage.removeItem('auth_expiration');
        setIsAuthenticated(false);
      }
    }
    
    // Update based on actual user state when available
    if (!loading) {
      setIsAuthenticated(!!user);
      
      if (user) {
        // Store authentication state in localStorage if not already set
        // (The login form will set these with the appropriate expiration)
        if (!localStorage.getItem('auth_state')) {
          localStorage.setItem('auth_state', 'authenticated');
          localStorage.setItem('auth_time', Date.now().toString());
          
          // Default expiration of 1 day if not set during login
          const oneDayFromNow = Date.now() + (24 * 60 * 60 * 1000);
          localStorage.setItem('auth_expiration', oneDayFromNow.toString());
        }
      } else {
        // If Supabase says we're not authenticated, clear local storage auth
        localStorage.removeItem('auth_state');
        localStorage.removeItem('auth_time');
        localStorage.removeItem('auth_expiration');
      }
    }
  }, [user, loading]);

  // Show loading spinner while checking auth
  if (loading && isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // If not authenticated, show login prompt or custom fallback
  if (!isAuthenticated && !user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">You need to be logged in</h2>
          <p className="text-gray-600 mb-6">Please log in to access this page</p>
          <Link href="/auth/login" className="text-teal-600 hover:text-teal-800 font-medium">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  // User is authenticated or has valid auth in localStorage, render children
  return <>{children}</>;
} 