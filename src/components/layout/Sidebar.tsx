"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const Sidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Clean up event listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  const isActive = (path: string) => {
    if (path === '/ai-chat' && (pathname === '/ai-chat' || pathname === '/chat')) {
      return 'bg-teal-100 text-teal-600';
    }
    return pathname === path ? 'bg-teal-100 text-teal-600' : 'text-gray-600 hover:bg-gray-50 hover:text-teal-600';
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <button 
          onClick={toggleSidebar}
          className="fixed bottom-6 right-6 z-50 bg-teal-600 text-white p-3 rounded-full shadow-lg"
          aria-label="Toggle menu"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
            />
          </svg>
        </button>
      )}

      {/* Backdrop overlay when sidebar is open on mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`bg-white shadow-sm overflow-y-auto z-40 transition-all duration-300 ease-in-out ${
          isMobile 
            ? `fixed inset-y-0 right-0 w-64 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
            : 'w-64 h-[calc(100vh-5rem)] fixed left-0 top-20'
        }`}
      >
        <div className="px-4 py-6">
          {isMobile && (
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {!isMobile && (
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu</h2>
          )}

          <nav className="space-y-1">
            <Link 
              href="/dashboard" 
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/dashboard')}`}
              onClick={() => isMobile && setIsOpen(false)}
            >
              <svg 
                className="text-gray-400 group-hover:text-teal-500 mr-3 h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
              Dashboard
            </Link>

            <Link 
              href="/ai-chat" 
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/ai-chat')}`}
              onClick={() => isMobile && setIsOpen(false)}
            >
              <svg 
                className="text-gray-400 group-hover:text-teal-500 mr-3 h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                />
              </svg>
              AI Chat
            </Link>

            <Link 
              href="/exercises" 
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/exercises')}`}
              onClick={() => isMobile && setIsOpen(false)}
            >
              <svg 
                className="text-gray-400 group-hover:text-teal-500 mr-3 h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                />
              </svg>
              Exercises
            </Link>

            <Link 
              href="/mood-tracker" 
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/mood-tracker')}`}
              onClick={() => isMobile && setIsOpen(false)}
            >
              <svg 
                className="text-gray-400 group-hover:text-teal-500 mr-3 h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
              Mood Tracker
            </Link>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 