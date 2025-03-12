'use client';

import { useState, useEffect } from 'react';
import { MoodEntry, User } from '@/types';
import { getCurrentUser } from '@/lib/auth0';
import AuthCheck from '@/components/auth/AuthCheck';
import Sidebar from '@/components/layout/Sidebar';
import { motion } from 'framer-motion';

type MoodOption = {
  value: 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad';
  label: string;
  emoji: string;
  color: string;
  score: number;
  description: string;
};

const moodOptions: MoodOption[] = [
  { 
    value: 'very_happy', 
    label: 'Very Happy', 
    emoji: '😄', 
    color: 'bg-green-500',
    score: 5,
    description: 'Feeling great! Full of energy and positivity'
  },
  { 
    value: 'happy', 
    label: 'Happy', 
    emoji: '🙂', 
    color: 'bg-green-400',
    score: 4,
    description: 'Content and in good spirits'
  },
  { 
    value: 'neutral', 
    label: 'Neutral', 
    emoji: '😐', 
    color: 'bg-yellow-400',
    score: 3,
    description: 'Neither particularly good nor bad'
  },
  { 
    value: 'sad', 
    label: 'Sad', 
    emoji: '😔', 
    color: 'bg-red-400',
    score: 2,
    description: 'Feeling down or upset'
  },
  { 
    value: 'very_sad', 
    label: 'Very Sad', 
    emoji: '😢', 
    color: 'bg-red-500',
    score: 1,
    description: 'Really struggling or feeling very low'
  },
];

const factors = [
  { id: 'sleep', label: 'Sleep Quality', icon: '😴', description: 'How well did you sleep?' },
  { id: 'exercise', label: 'Exercise', icon: '🏃‍♂️', description: 'Physical activity level' },
  { id: 'nutrition', label: 'Nutrition', icon: '🥗', description: 'Quality of your meals' },
  { id: 'social', label: 'Social Interaction', icon: '👥', description: 'Time spent with others' },
  { id: 'work', label: 'Work/Study', icon: '💼', description: 'Work or study stress' },
  { id: 'meditation', label: 'Meditation', icon: '🧘‍♂️', description: 'Mindfulness practice' },
];

export default function MoodTracker() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [note, setNote] = useState('');
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [view, setView] = useState<'log' | 'history' | 'insights'>('log');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [factorStats, setFactorStats] = useState<Record<string, { count: number; avgMood: number }>>({});

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    fetchUser();

    // Load mood history
    const savedMoods = localStorage.getItem('mood_entries');
    if (savedMoods) {
      const entries = JSON.parse(savedMoods);
      setMoodHistory(entries);
      calculateFactorStats(entries);
    }
  }, []);

  const calculateFactorStats = (entries: MoodEntry[]) => {
    const stats: Record<string, { count: number; totalScore: number }> = {};
    
    entries.forEach(entry => {
      if (entry.factors) {
        entry.factors.forEach(factor => {
          if (!stats[factor]) {
            stats[factor] = { count: 0, totalScore: 0 };
          }
          stats[factor].count += 1;
          stats[factor].totalScore += entry.moodValue;
        });
      }
    });

    const averagedStats: Record<string, { count: number; avgMood: number }> = {};
    Object.entries(stats).forEach(([factor, data]) => {
      averagedStats[factor] = {
        count: data.count,
        avgMood: parseFloat((data.totalScore / data.count).toFixed(2))
      };
    });

    setFactorStats(averagedStats);
  };

  const handleSubmit = async () => {
    if (!selectedMood || !user) return;

    setIsSubmitting(true);
    
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      userId: user.id,
      mood: selectedMood.value,
      moodValue: selectedMood.score,
      date: new Date().toISOString(),
      timestamp: new Date(),
      notes: note,
      factors: selectedFactors
    };

    const updatedHistory = [newEntry, ...moodHistory];
    setMoodHistory(updatedHistory);
    localStorage.setItem('mood_entries', JSON.stringify(updatedHistory));
    calculateFactorStats(updatedHistory);

    // Reset form
    setSelectedMood(null);
    setNote('');
    setSelectedFactors([]);
    setIsSubmitting(false);
    setView('history');
  };

  const getMoodTrend = () => {
    if (moodHistory.length < 2) return null;
    
    const recent = moodHistory[0].moodValue;
    const previous = moodHistory[1].moodValue;
    
    if (recent > previous) return { trend: 'improving', icon: '📈' };
    if (recent < previous) return { trend: 'declining', icon: '📉' };
    return { trend: 'stable', icon: '📊' };
  };

  const getAverageMood = (days: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const relevantEntries = moodHistory.filter(
      entry => new Date(entry.date) >= cutoff
    );

    if (relevantEntries.length === 0) return null;

    const average = relevantEntries.reduce((sum, entry) => sum + entry.moodValue, 0) / relevantEntries.length;
    return parseFloat(average.toFixed(2));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMoodLog = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">How are you feeling?</h2>
        <div className="grid grid-cols-5 gap-4 mb-6">
          {moodOptions.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => setSelectedMood(option)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-4 rounded-lg border-2 transition-all relative group ${
                selectedMood?.value === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-2">{option.emoji}</div>
              <div className="text-sm font-medium">{option.label}</div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {option.description}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
              </div>
            </motion.button>
          ))}
        </div>

        <h3 className="font-medium mb-3">What factors are affecting your mood?</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {factors.map((factor) => (
            <motion.button
              key={factor.id}
              onClick={() => {
                setSelectedFactors(prev => 
                  prev.includes(factor.id)
                    ? prev.filter(f => f !== factor.id)
                    : [...prev, factor.id]
                );
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-3 rounded-lg border-2 transition-all flex items-center space-x-2 relative group ${
                selectedFactors.includes(factor.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="text-xl">{factor.icon}</span>
              <span className="text-sm font-medium">{factor.label}</span>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {factor.description}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add a note (optional)
          </label>
          <div className="relative">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all"
              rows={3}
              placeholder="How was your day? What made you feel this way?"
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {note.length}/500 characters
            </div>
          </div>
        </div>

        <motion.button
          onClick={handleSubmit}
          disabled={!selectedMood || isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 px-4 rounded-md text-white font-medium transition-all ${
            !selectedMood || isSubmitting
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            'Save Mood'
          )}
        </motion.button>
      </div>
    </motion.div>
  );

  const renderMoodHistory = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Mood History</h2>
        <div className="space-y-4">
          {moodHistory.map((entry, index) => {
            const moodOption = moodOptions.find(m => m.value === entry.mood);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${moodOption?.color} bg-opacity-10`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{moodOption?.emoji}</span>
                    <span className="font-medium">{moodOption?.label}</span>
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(entry.date)}</span>
                </div>
                {entry.factors && entry.factors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {entry.factors.map(factorId => {
                      const factor = factors.find(f => f.id === factorId);
                      return factor ? (
                        <span key={factorId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-50 text-gray-800 shadow-sm">
                          {factor.icon} {factor.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                {entry.notes && (
                  <p className="text-gray-600 text-sm bg-white bg-opacity-50 rounded-md p-2">{entry.notes}</p>
                )}
              </motion.div>
            );
          })}
          {moodHistory.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-gray-500">No mood entries yet</p>
              <button
                onClick={() => setView('log')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Start tracking your mood
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderInsights = () => {
    const trend = getMoodTrend();
    const weeklyAvg = getAverageMood(7);
    const monthlyAvg = getAverageMood(30);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg"
          >
            <h3 className="text-sm font-medium text-gray-500 mb-2">Current Trend</h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{trend?.icon}</span>
              <span className="text-xl font-semibold capitalize">{trend?.trend || 'Not enough data'}</span>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg"
          >
            <h3 className="text-sm font-medium text-gray-500 mb-2">Weekly Average</h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">
                {weeklyAvg ? moodOptions.find(m => m.score === Math.round(weeklyAvg))?.emoji : '📊'}
              </span>
              <span className="text-xl font-semibold">
                {weeklyAvg ? `${weeklyAvg}/5` : 'No data'}
              </span>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg"
          >
            <h3 className="text-sm font-medium text-gray-500 mb-2">Monthly Average</h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">
                {monthlyAvg ? moodOptions.find(m => m.score === Math.round(monthlyAvg))?.emoji : '📊'}
              </span>
              <span className="text-xl font-semibold">
                {monthlyAvg ? `${monthlyAvg}/5` : 'No data'}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Factor Analysis */}
        <motion.div
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4">Factor Analysis</h2>
          <div className="space-y-4">
            {factors.map((factor, index) => {
              const stats = factorStats[factor.id];
              if (!stats) return null;
              
              return (
                <motion.div
                  key={factor.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{factor.icon}</span>
                      <span className="font-medium">{factor.label}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {stats.count} entries
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-grow bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.avgMood / 5) * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="bg-blue-600 rounded-full h-2"
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {stats.avgMood.toFixed(1)}/5
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <AuthCheck>
      <div className="flex bg-white min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Mood Tracker</h1>
              <div className="flex space-x-4">
                {['log', 'history', 'insights'].map((viewOption) => (
                  <motion.button
                    key={viewOption}
                    onClick={() => setView(viewOption as typeof view)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-md transition-all ${
                      view === viewOption
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>

            {view === 'log' && renderMoodLog()}
            {view === 'history' && renderMoodHistory()}
            {view === 'insights' && renderInsights()}
          </div>
        </div>
      </div>
    </AuthCheck>
  );
} 