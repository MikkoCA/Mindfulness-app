"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading: isLoading } = useAuth();

  const isActive = (path: string) => {
    return pathname === path 
      ? 'text-teal-500 border-b-2 border-teal-500 font-medium transition-all duration-300 ease-in-out' 
      : 'text-gray-600 hover:text-teal-500 hover:border-b-2 hover:border-teal-300 transition-all duration-300 ease-in-out';
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'G';
    
    if (user.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    if (!user) return '';
    
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'User';
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 w-full z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-teal-600">Mindfulness</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className={isActive('/')}>
              Home
            </Link>
            <Link href="/exercises" className={isActive('/exercises')}>
              Exercises
            </Link>
            <Link href="/chat" className={isActive('/chat')}>
              Chat
            </Link>
            <Link href="/mood-tracker" className={isActive('/mood-tracker')}>
              Mood Tracker
            </Link>
          </nav>
          
          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 group">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-medium">
                    {getUserInitials()}
                  </div>
                  <span className="text-gray-700">{getDisplayName()}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 invisible group-hover:visible transition-all duration-200 opacity-0 group-hover:opacity-100">
                  <Link href="/auth/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-600 hover:text-teal-500">
                  Login
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <button onClick={toggleMenu} className="md:hidden text-gray-500 focus:outline-none">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-teal-500 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/exercises" 
                className="text-gray-600 hover:text-teal-500 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Exercises
              </Link>
              <Link 
                href="/chat" 
                className="text-gray-600 hover:text-teal-500 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Chat
              </Link>
              <Link 
                href="/mood-tracker" 
                className="text-gray-600 hover:text-teal-500 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Mood Tracker
              </Link>
              
              <div className="pt-3 border-t border-gray-200">
                {user ? (
                  <>
                    <div className="flex items-center space-x-2 py-2">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-medium">
                        {getUserInitials()}
                      </div>
                      <span className="text-gray-700 font-medium">{getDisplayName()}</span>
                    </div>
                    <Link 
                      href="/auth/profile" 
                      className="block text-gray-600 hover:text-teal-500 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="text-gray-600 hover:text-teal-500 py-2"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/auth/login" 
                      className="block text-gray-600 hover:text-teal-500 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      href="/auth/signup" 
                      className="block text-teal-500 font-medium py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 