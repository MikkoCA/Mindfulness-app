'use client';

import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { useEffect, useState } from 'react';
import { getCurrentUser, User } from '@/lib/auth0';
import AuthCheck from '@/components/auth/AuthCheck';
import { Exercise, MoodEntry, ActivityLog } from '@/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([]);
  const [weeklyMoodAverage, setWeeklyMoodAverage] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    
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
    
    fetchUser();

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

    // Generate activity log
    generateActivityLog();
  }, [weeklyMoodAverage]); // Added weeklyMoodAverage as dependency since it's used in generateRecommendations

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
    <AuthCheck>
      <div className="flex flex-col md:flex-row bg-white min-h-screen">
        {/* On desktop, sidebar is visible. On mobile, it's accessible through the toggle button */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        {/* Main content - full width on mobile, with left margin on desktop */}
        <div className="w-full md:ml-64 p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-8">
            Dashboard
          </h1>
          
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-8 rounded-lg border border-gray-100 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Welcome{user ? `, ${user.name.split(' ')[0]}` : ''}!
            </h2>
            <p className="text-gray-700 mb-4 text-sm md:text-base">
              Track your progress, explore new exercises, and continue your mindfulness journey.
            </p>
            <Link 
              href="/chat" 
              className="bg-blue-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-md font-medium hover:bg-blue-700 transition-colors inline-block text-sm md:text-base"
            >
              Start a Session
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-6 mb-6 md:mb-8">
            {/* Mood Overview */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Mood Overview</h2>
              {weeklyMoodAverage ? (
                <div className="text-center">
                  <div className="text-3xl md:text-4xl mb-2">
                    {getMoodEmoji(weeklyMoodAverage)}
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-gray-800">
                    {weeklyMoodAverage}/5
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">Weekly Average</div>
                </div>
              ) : (
                <p className="text-gray-500 text-center text-sm md:text-base">No mood data available</p>
              )}
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Recent Activity</h2>
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center text-xs md:text-sm">
                      <span className="mr-2 text-xl flex-shrink-0">
                        {activity.type === 'mood' ? '🎭' : 
                         activity.type === 'exercise' ? '🧘‍♂️' : '💭'}
                      </span>
                      <span className="flex-1 line-clamp-1">{activity.details}</span>
                      <span className="text-gray-500 ml-2 text-xs flex-shrink-0">{formatDate(activity.date)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center text-sm md:text-base">No recent activity</p>
              )}
            </div>
          </div>
          
          {/* Recommended Exercises */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Recommended for You</h2>
            {recommendedExercises.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recommendedExercises.map((exercise) => (
                  <Link href={`/exercises/${exercise.id}`} key={exercise.id}>
                    <div className="border rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
                      <div className="flex items-center mb-2">
                        <span className="text-xl md:text-2xl mr-2">
                          {exercise.category === 'breathing' ? '🫁' :
                           exercise.category === 'meditation' ? '🧘‍♂️' :
                           '🎯'}
                        </span>
                        <h3 className="font-medium text-sm md:text-base line-clamp-1">{exercise.title}</h3>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">{exercise.description}</p>
                      <div className="flex items-center text-xs md:text-sm text-gray-500">
                        <span>{exercise.duration} min</span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{exercise.difficulty}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 md:py-8">
                <p className="text-gray-500 mb-4 text-sm md:text-base">No recommendations available yet</p>
                <Link href="/exercises">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm md:text-base">
                    Browse All Exercises
                  </button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/mood">
              <div className="bg-purple-50 p-4 md:p-6 rounded-lg hover:bg-purple-100 transition-colors">
                <h3 className="font-semibold text-purple-800 mb-2 text-sm md:text-base">Track Your Mood</h3>
                <p className="text-xs md:text-sm text-gray-700">Log how you&apos;re feeling right now</p>
              </div>
            </Link>
            
            <Link href="/exercises">
              <div className="bg-blue-50 p-4 md:p-6 rounded-lg hover:bg-blue-100 transition-colors">
                <h3 className="font-semibold text-blue-800 mb-2 text-sm md:text-base">Start Exercise</h3>
                <p className="text-xs md:text-sm text-gray-700">Choose from mindfulness exercises</p>
              </div>
            </Link>
            
            <Link href="/chat">
              <div className="bg-green-50 p-4 md:p-6 rounded-lg hover:bg-green-100 transition-colors">
                <h3 className="font-semibold text-green-800 mb-2 text-sm md:text-base">Chat with AI</h3>
                <p className="text-xs md:text-sm text-gray-700">Get personalized mindfulness advice</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AuthCheck>
  );
}
