'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type MindfulnessSession = {
  id: string;
  user_id: string;
  created_at: string;
  duration_minutes: number;
  session_type: string;
  notes?: string;
};

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<MindfulnessSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'week', 'month'

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        let query = supabase
          .from('mindfulness_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        // Apply time filter if needed
        if (filter === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          query = query.gte('created_at', oneWeekAgo.toISOString());
        } else if (filter === 'month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          query = query.gte('created_at', oneMonthAgo.toISOString());
        }
        
        const { data, error } = await query;
          
        if (error) throw error;
        
        if (data) {
          setSessions(data as MindfulnessSession[]);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchSessions();
    } else if (!loading) {
      setIsLoading(false);
    }
  }, [user, loading, filter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalMinutes = () => {
    return sessions.reduce((total, session) => total + (session.duration_minutes || 0), 0);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">You need to be logged in</h2>
          <Link href="/auth/login" className="text-teal-600 hover:text-teal-800">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Session History</h1>
            <p className="mt-2 text-sm text-gray-600">
              View your past mindfulness sessions
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <div className="relative inline-block text-left">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Summary
            </h3>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Sessions
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {sessions.length}
                  </dd>
                </div>
              </div>
              <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Minutes
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {getTotalMinutes()}
                  </dd>
                </div>
              </div>
              <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Session Length
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {sessions.length > 0 ? Math.round(getTotalMinutes() / sessions.length) : 0} min
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sessions List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Session Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your mindfulness practice history
            </p>
          </div>
          
          {sessions.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't completed any mindfulness sessions yet.
              </p>
              <div className="mt-6">
                <Link
                  href="/chat"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Start a Session
                </Link>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {sessions.map((session) => (
                  <li key={session.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {session.session_type || 'Mindfulness Session'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(session.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {session.duration_minutes} minutes
                        </span>
                      </div>
                    </div>
                    {session.notes && (
                      <div className="mt-2 text-sm text-gray-700 ml-14">
                        <p>{session.notes}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 