"use client";

import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import AuthCheck from '@/components/auth/AuthCheck';
import { Exercise, MoodEntry, ActivityLog } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AuthGuard from '@/components/auth/AuthGuard';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    streak: 0,
    lastSession: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([]);
  const [weeklyMoodAverage, setWeeklyMoodAverage] = useState<number | null>(null);

  // First useEffect for fetching user stats from Supabase
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // Fetch user's mindfulness sessions
        const { data, error } = await supabase
          .from('mindfulness_sessions')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        if (data) {
          // Calculate stats
          const totalSessions = data.length;
          const totalMinutes = data.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
          
          // Sort sessions by date
          const sortedSessions = [...data].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          const lastSession = sortedSessions.length > 0 ? sortedSessions[0] : null;
          
          // Calculate streak (consecutive days with sessions)
          let streak = 0;
          if (sortedSessions.length > 0) {
            // Simple streak calculation
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            // Check if there's a session today
            const hasSessionToday = sortedSessions.some(session => {
              const sessionDate = new Date(session.created_at);
              sessionDate.setHours(0, 0, 0, 0);
              return sessionDate.getTime() === today.getTime();
            });
            
            if (hasSessionToday) {
              streak = 1;
              
              // Check previous days
              let checkDate = yesterday;
              let foundGap = false;
              
              while (!foundGap) {
                const hasSessionOnDate = sortedSessions.some(session => {
                  const sessionDate = new Date(session.created_at);
                  sessionDate.setHours(0, 0, 0, 0);
                  return sessionDate.getTime() === checkDate.getTime();
                });
                
                if (hasSessionOnDate) {
                  streak++;
                  const prevDay = new Date(checkDate);
                  prevDay.setDate(prevDay.getDate() - 1);
                  checkDate = prevDay;
                } else {
                  foundGap = true;
                }
              }
            }
          }
          
          setStats({
            totalSessions,
            totalMinutes,
            streak,
            lastSession
          });
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchUserStats();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Second useEffect for loading local data and generating recommendations
  useEffect(() => {
    // Only proceed if user is authenticated
    if (!user) return;
    
    const generateRecommendations = (exercises: Exercise[]) => {
      // Get user's mood trend
      const moodTrend = weeklyMoodAverage || 3;
      
      // Filter and sort exercises based on mood and previous completion
      const completedExercises = new Set(JSON.parse(localStorage.getItem('completed_exercises') || '[]'));
      
      const recommended = exercises
        .filter(exercise => !completedExercises.has(exercise.id))
        .sort((a, b) => {
          if (moodTrend <= 2.5) {
            return (a.duration - b.duration) || 
                   (a.difficulty === 'beginner' ? -1 : 1);
          } else if (moodTrend >= 4) {
            return (b.duration - a.duration) || 
                   (b.difficulty === 'advanced' ? -1 : 1);
          }
          return Math.random() - 0.5;
        });

      setRecommendedExercises(recommended.slice(0, 3));
    };

    // Load mood entries
    const savedMoods = localStorage.getItem('mood_entries');
    if (savedMoods) {
      const moodEntries = JSON.parse(savedMoods);
      calculateWeeklyMoodAverage(moodEntries);
    }

    // Load exercises
    const savedExercises = localStorage.getItem('mindfulness_exercises');
    if (savedExercises) {
      const exercises = JSON.parse(savedExercises);
      generateRecommendations(exercises);
    }

    // Generate and load recent activities
    generateActivityLog();
  }, [user, weeklyMoodAverage]); // Added user as dependency

  const calculateWeeklyMoodAverage = (moods: MoodEntry[]) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekMoods = moods.filter(mood => 
      new Date(mood.date) >= oneWeekAgo && new Date(mood.date) <= now
    );

    if (weekMoods.length > 0) {
      const average = weekMoods.reduce((sum, mood) => sum + mood.moodValue, 0) / weekMoods.length;
      setWeeklyMoodAverage(parseFloat(average.toFixed(1)));
    }
  };

  const generateActivityLog = () => {
    const activities: ActivityLog[] = [];

    // Get mood entries
    const moodEntries = JSON.parse(localStorage.getItem('mood_entries') || '[]');
    moodEntries.forEach((mood: MoodEntry) => {
      activities.push({
        id: mood.id,
        type: 'mood',
        date: mood.date,
        details: `Logged mood: ${mood.mood}`
      });
    });

    // Get completed exercises
    const completedExercises = JSON.parse(localStorage.getItem('completed_exercises') || '[]');
    const allExercises = JSON.parse(localStorage.getItem('mindfulness_exercises') || '[]');
    
    completedExercises.forEach((exerciseId: string) => {
      const exercise = allExercises.find((ex: Exercise) => ex.id === exerciseId);
      if (exercise) {
        activities.push({
          id: exerciseId,
          type: 'exercise',
          date: new Date().toISOString(),
          details: `Completed exercise: ${exercise.title}`
        });
      }
    });

    // Sort by date (most recent first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Save activities to localStorage
    localStorage.setItem('activity_log', JSON.stringify(activities));
    
    // Update state with the first 10 activities
    setRecentActivities(activities.slice(0, 10));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoodEmoji = (moodValue: number) => {
    if (moodValue >= 4.5) return '😄';
    if (moodValue >= 3.5) return '🙂';
    if (moodValue >= 2.5) return '😐';
    if (moodValue >= 1.5) return '😔';
    return '😢';
  };

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[rgb(203,251,241)] via-white to-[rgb(203,251,241)]">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4"
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
              Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <Link
                href="/exercises"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="mr-2">🧘‍♂️</span>
                Start Exercise
              </Link>
              <Link
                href="/mood-tracker"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium bg-white border border-[rgb(203,251,241)] text-teal-600 shadow-lg shadow-teal-500/10 hover:shadow-xl hover:shadow-teal-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="mr-2">📝</span>
                Log Mood
              </Link>
            </div>
          </motion.div>

          <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Exercise Stats */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Exercise Stats</h3>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Sessions</span>
                      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                        {stats.totalSessions}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Minutes Practiced</span>
                      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                        {stats.totalMinutes}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mood Stats */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Mood Stats</h3>
                    <span className="text-2xl">🎭</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Entries</span>
                      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                        {recentActivities.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Mood</span>
                      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                        {weeklyMoodAverage ? weeklyMoodAverage.toFixed(1) : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Streak Stats */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Streaks</h3>
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Current Streak</span>
                      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                        {stats.streak}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Best Streak</span>
                      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                        {stats.streak}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                    Recent Activity
                  </h3>
                  <Link
                    href="/history"
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    View All
                  </Link>
                </div>
                {recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivities.slice(0, 5).map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-[rgb(203,251,241)]/20 border border-[rgb(203,251,241)]"
                      >
                        <div className="text-2xl">
                          {activity.type === 'exercise' ? '🧘‍♂️' : '📝'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">
                            {activity.type === 'exercise' ? 'Completed Exercise' : 'Logged Mood'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {activity.details}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(activity.date)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Sidebar Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Mood Trends */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-6">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 mb-6">
                  Mood Trends
                </h3>
                {weeklyMoodAverage && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Weekly Average</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getMoodEmoji(weeklyMoodAverage)}</span>
                        <span className="font-bold text-gray-800">{weeklyMoodAverage.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Monthly Average</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getMoodEmoji(weeklyMoodAverage)}</span>
                        <span className="font-bold text-gray-800">{weeklyMoodAverage.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-600 mb-2">Trend</div>
                      <div className="relative h-2 bg-[rgb(203,251,241)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(weeklyMoodAverage + 5) * 10}%` }}
                          transition={{ duration: 0.6 }}
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-6">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 mb-6">
                  Quick Actions
                </h3>
                <div className="space-y-4">
                  <Link
                    href="/exercises"
                    className="flex items-center justify-between p-4 rounded-xl bg-[rgb(203,251,241)]/20 border border-[rgb(203,251,241)] hover:bg-[rgb(203,251,241)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🧘‍♂️</span>
                      <div>
                        <h4 className="font-medium text-gray-800">Start Exercise</h4>
                        <p className="text-sm text-gray-600">Choose from various mindfulness exercises</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/mood-tracker"
                    className="flex items-center justify-between p-4 rounded-xl bg-[rgb(203,251,241)]/20 border border-[rgb(203,251,241)] hover:bg-[rgb(203,251,241)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📝</span>
                      <div>
                        <h4 className="font-medium text-gray-800">Log Mood</h4>
                        <p className="text-sm text-gray-600">Track your daily emotional state</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/history"
                    className="flex items-center justify-between p-4 rounded-xl bg-[rgb(203,251,241)]/20 border border-[rgb(203,251,241)] hover:bg-[rgb(203,251,241)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <h4 className="font-medium text-gray-800">View History</h4>
                        <p className="text-sm text-gray-600">See your progress over time</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}