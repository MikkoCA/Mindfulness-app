'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/lib/auth0';
import { 
  getStoredUser, 
  storeUser, 
  removeStoredUser, 
  getLoginUrl, 
  getLogoutUrl, 
  parseAuthParameters 
} from '@/lib/auth0Client';

interface Auth0ContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
  loading: boolean;
}

const Auth0Context = createContext<Auth0ContextType | undefined>(undefined);

export function useAuth0() {
  const context = useContext(Auth0Context);
  if (!context) {
    throw new Error('useAuth0 must be used within an Auth0Provider');
  }
  return context;
}

interface Auth0ProviderProps {
  children: ReactNode;
}

export function Auth0Provider({ children }: Auth0ProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on mount
  useEffect(() => {
    // Check for user in local storage or session
    const checkAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const currentUser = getStoredUser();
          
          // Also check URL for auth=success parameter which indicates successful login
          const authParams = parseAuthParameters();
          
          if (currentUser) {
            setUser(currentUser);
          } else if (authParams?.authSuccess) {
            // If auth was successful but we don't have user data,
            // we might need to fetch user data from an API or set default values
            const defaultUser = {
              id: 'temp-user-id',
              name: 'User',
              email: 'user@example.com',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            };
            
            setUser(defaultUser);
            storeUser(defaultUser);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    window.location.href = getLoginUrl();
  };

  const logout = () => {
    // Clear local storage and state
    removeStoredUser();
    setUser(null);

    // Redirect to Auth0 logout endpoint
    window.location.href = getLogoutUrl();
  };

  const value = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
    loading
  };

  return (
    <Auth0Context.Provider value={value}>
      {children}
    </Auth0Context.Provider>
  );
} 