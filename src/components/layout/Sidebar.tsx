"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'bg-teal-100 text-teal-600' : 'text-gray-600 hover:bg-gray-50 hover:text-teal-600';
  };

  return (
    <aside className="w-64 bg-white shadow-sm h-[calc(100vh-5rem)] fixed left-0 top-20 overflow-y-auto">
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu</h2>
        <nav className="space-y-1">
          <Link 
            href="/" 
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/')}`}
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
            href="/chat" 
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/chat')}`}
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
  );
};

export default Sidebar; 