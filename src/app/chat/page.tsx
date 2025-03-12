'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ChatContainer from '@/components/chat/ChatContainer';
import AuthCheck from '@/components/auth/AuthCheck';
import { getCurrentUser, User } from '@/lib/auth0';

export default function Chat() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    
    fetchUser();
    
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

  return (
    <AuthCheck>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-white">
        {/* Sidebar - hidden on mobile, shown on desktop */}
        <div className="hidden md:block md:w-64 md:flex-shrink-0 md:fixed md:h-[calc(100vh-4rem)] md:bg-white md:border-r md:border-gray-200">
          <Sidebar />
        </div>

        {/* Main Content - full width on mobile, with left margin on desktop */}
        <div className="flex-1 flex flex-col md:pl-64">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 md:py-4 sticky top-16 z-10">
            <div className="max-w-5xl mx-auto w-full">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                AI Chat
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Chat with your mindfulness assistant
              </p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white">
            <div className="h-full max-w-5xl mx-auto w-full px-3 md:px-8 py-3 md:py-4">
              <ChatContainer initialMessage={
                user ? 
                `Hi ${user.name?.split(' ')[0] || 'there'}! How are you feeling today? I can help you with:
                • Guided meditation exercises
                • Breathing techniques
                • Mindfulness practices
                • Stress management strategies
                
                What would you like to focus on today?`
                : 
                `Welcome to the Mindfulness Chatbot! I'm here to help with:
                • Guided meditation exercises
                • Breathing techniques
                • Mindfulness practices
                • Stress management strategies
                
                What would you like assistance with today?`
              } />
            </div>
          </div>
        </div>
      </div>
    </AuthCheck>
  );
} 