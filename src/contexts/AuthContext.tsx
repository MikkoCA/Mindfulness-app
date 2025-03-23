'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

// Helper function to check if an error is a cookie parsing error that we want to ignore
const isCookieParsingError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('Failed to parse cookie') || 
           error.message.includes('base64-eyJ');
  }
  return false;
};

// Helper function to check if the stored auth is still valid
const isStoredAuthValid = (): boolean => {
  try {
    const storedAuthState = localStorage.getItem('auth_state');
    const storedAuthExpiration = localStorage.getItem('auth_expiration');
    
    if (storedAuthState === 'authenticated' && storedAuthExpiration) {
      const expirationTime = parseInt(storedAuthExpiration, 10);
      const currentTime = Date.now();
      
      return currentTime < expirationTime;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking stored auth:', error);
    return false;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getUser = async () => {
      try {
        // First check localStorage for a valid auth state
        const hasValidLocalAuth = isStoredAuthValid();
        
        // Get user from Supabase
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          // If we have a valid local auth but Supabase error, try to recover
          if (hasValidLocalAuth) {
            console.log('Attempting to recover session from localStorage...');
            try {
              // Try to refresh the session
              const { data: refreshData } = await supabase.auth.refreshSession();
              
              if (refreshData.session && mounted) {
                setUser(refreshData.user);
                setError(null);
                setLoading(false);
                
                // Update localStorage with refreshed session info
                localStorage.setItem('auth_state', 'authenticated');
                const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
                localStorage.setItem('auth_expiration', thirtyDaysFromNow.toString());
                
                return;
              }
            } catch (refreshError) {
              console.error('Failed to refresh session:', refreshError);
            }
          }
          
          // If we couldn't recover the session, throw the original error
          if (!isCookieParsingError(userError)) {
            throw userError;
          }
        }

        if (mounted) {
          setUser(user);
          setError(null);
          
          // If we have a user, update localStorage
          if (user) {
            localStorage.setItem('auth_state', 'authenticated');
            
            // If there's no expiration set, set a default one (30 days)
            if (!localStorage.getItem('auth_expiration')) {
              const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
              localStorage.setItem('auth_expiration', thirtyDaysFromNow.toString());
            }
          }
        }
      } catch (error) {
        // Only log errors that aren't cookie parsing errors we want to ignore
        if (!isCookieParsingError(error)) {
          console.error('Error fetching user:', error);
        }
        
        if (mounted) {
          // Only set error state for non-cookie parsing errors
          if (!isCookieParsingError(error)) {
            setError(error instanceof Error ? error.message : 'Failed to fetch user');
          }
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        console.log('Auth state changed:', event);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Update localStorage when session changes
          localStorage.setItem('auth_state', 'authenticated');
          
          // Set a longer expiration (30 days)
          const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
          localStorage.setItem('auth_expiration', thirtyDaysFromNow.toString());
        } else if (event === 'SIGNED_OUT') {
          // Clear localStorage on sign out
          localStorage.removeItem('auth_state');
          localStorage.removeItem('auth_time');
          localStorage.removeItem('auth_expiration');
          localStorage.removeItem('remembered_email');
        }
        
        setLoading(false);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 