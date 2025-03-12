'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ChatContainer from '@/components/chat/ChatContainer';
import AuthCheck from '@/components/auth/AuthCheck';
import { getCurrentUser, User } from '@/lib/auth0';

export default function Chat() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    
    fetchUser();
  }, []);

  return (
    <AuthCheck>
      <div className="min-h-[calc(100vh-4rem)] flex bg-white">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 fixed h-[calc(100vh-4rem)] bg-white border-r border-gray-200">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col pl-64">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-16 z-10">
            <div className="max-w-5xl mx-auto w-full">
              <h1 className="text-2xl font-semibold text-gray-900">
                AI Chat
              </h1>
              <p className="text-gray-600 mt-1">
                Chat with your mindfulness assistant
              </p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white">
            <div className="h-full max-w-5xl mx-auto w-full px-8 py-4">
              <ChatContainer initialMessage={
                user ? 
                `Hi ${user.name.split(' ')[0]}! How are you feeling today? I can help you with:
                • Guided meditation exercises
                • Breathing techniques
                • Mindfulness practices
                • Mood tracking
                
                What would you like to explore?` :
                "Hello! How are you feeling today? I'm here to help you with mindfulness exercises and meditation. What would you like to explore?"
              } />
            </div>
          </div>
        </div>
      </div>
    </AuthCheck>
  );
} 