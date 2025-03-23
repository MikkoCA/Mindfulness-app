"use client";

import { useState, useEffect } from 'react';
import { MoodEntry } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import { motion } from 'framer-motion';
import AuthGuard from '@/components/auth/AuthGuard';
import Link from 'next/link';

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
    color: 'bg-emerald-500',
    score: 5,
    description: 'Feeling fantastic and full of energy!'
  },
  { 
    value: 'happy', 
    label: 'Happy', 
    emoji: '🙂', 
    color: 'bg-emerald-400',
    score: 4,
    description: 'Content and in good spirits'
  },
  { 
    value: 'neutral', 
    label: 'Neutral', 
    emoji: '😐', 
    color: 'bg-amber-400',
    score: 3,
    description: 'Neither particularly good nor bad'
  },
  { 
    value: 'sad', 
    label: 'Sad', 
    emoji: '😔', 
    color: 'bg-rose-400',
    score: 2,
    description: 'Feeling down or upset'
  },
  { 
    value: 'very_sad', 
    label: 'Very Sad', 
    emoji: '😢', 
    color: 'bg-rose-500',
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
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [note, setNote] = useState('');
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [view, setView] = useState<'log' | 'history' | 'insights'>('log');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [factorStats, setFactorStats] = useState<Record<string, { count: number; avgMood: number }>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Load mood history
    const savedMoods = localStorage.getItem('mood_entries');
    if (savedMoods) {
      const entries = JSON.parse(savedMoods);
      setMoodHistory(entries);
      calculateFactorStats(entries);
    }

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

  const getMoodTrend = (): string => {
    try {
      // If we have fewer than 2 entries, we can't calculate a trend
      if (moodHistory.length < 2) return 'Not enough data';
      
      // Get the last 5 entries, sorted by date
      const recentEntries = [...moodHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      // Calculate if mood is improving, worsening, or stable
      const oldestScore = recentEntries[recentEntries.length - 1].moodValue;
      const newestScore = recentEntries[0].moodValue;
      const difference = newestScore - oldestScore;
      
      if (difference >= 0.5) return '🔼 Improving';
      if (difference <= -0.5) return '🔽 Declining';
      return '➡️ Stable';
    } catch (error) {
      console.error('Error calculating mood trend:', error);
      return 'Not available';
    }
  };

  const getAverageMood = (days: number) => {
    // If we have no entries at all, return null
    if (moodHistory.length === 0) return null;
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const relevantEntries = moodHistory.filter(
      entry => new Date(entry.date) >= cutoff
    );

    // If we have entries but none in the specified time period,
    // use all available entries instead of returning null
    if (relevantEntries.length === 0) {
      // Use all entries if we don't have any in the specified time period
      const allEntriesAverage = moodHistory.reduce((sum, entry) => sum + entry.moodValue, 0) / moodHistory.length;
      return parseFloat(allEntriesAverage.toFixed(2));
    }

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
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 p-8 border border-[rgb(203,251,241)]">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 mb-8">How are you feeling?</h2>
        
        {/* Mood Selection */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {moodOptions.map((option, index) => (
            <motion.button
              key={option.value}
              onClick={() => setSelectedMood(option)}
              whileHover={{ scale: 1.05, y: -5, rotateX: 5 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.08,
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              className={`group flex flex-col items-center justify-center p-6 rounded-xl transition-all transform perspective-1000 ${
                selectedMood?.value === option.value
                  ? `${option.color} bg-opacity-15 ring-2 ring-opacity-70 ring-offset-4 ring-[rgb(203,251,241)]`
                  : 'bg-white/90 hover:bg-[rgb(203,251,241)] shadow-xl shadow-teal-500/10 hover:shadow-2xl hover:shadow-teal-500/20'
              }`}
            >
              <motion.div 
                className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12"
                animate={{ 
                  rotate: selectedMood?.value === option.value ? [0, -12, 12, -12, 0] : 0,
                  scale: selectedMood?.value === option.value ? [1, 1.1, 1.1, 1.1, 1] : 1
                }}
                transition={{ 
                  duration: 2,
                  repeat: selectedMood?.value === option.value ? Infinity : 0,
                  repeatDelay: 1
                }}
              >
                {option.emoji}
              </motion.div>
              <div className="text-sm font-semibold text-gray-700">{option.label}</div>
              {selectedMood?.value === option.value && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-gray-500 mt-2 text-center"
                >
                  {option.description}
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Factors Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">What factors are affecting your mood?</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {factors.map((factor, index) => (
              <motion.button
                key={factor.id}
                onClick={() => {
                  setSelectedFactors(prev => 
                    prev.includes(factor.id)
                      ? prev.filter(f => f !== factor.id)
                      : [...prev, factor.id]
                  );
                }}
                whileHover={{ scale: 1.03, y: -2, rotateX: 5 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.3 + (index * 0.05),
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                className={`group flex items-center p-4 rounded-xl transition-all transform perspective-1000 ${
                  selectedFactors.includes(factor.id)
                    ? 'bg-[rgb(203,251,241)] ring-2 ring-teal-200 shadow-xl shadow-teal-500/20'
                    : 'bg-white/90 hover:bg-[rgb(203,251,241)] shadow-xl shadow-teal-500/10 hover:shadow-2xl hover:shadow-teal-500/20'
                }`}
              >
                <motion.span 
                  className="text-2xl mr-3"
                  animate={{ 
                    rotate: selectedFactors.includes(factor.id) ? [0, -12, 12, -12, 0] : 0,
                    scale: selectedFactors.includes(factor.id) ? [1, 1.1, 1.1, 1.1, 1] : 1
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: selectedFactors.includes(factor.id) ? Infinity : 0,
                    repeatDelay: 1
                  }}
                >
                  {factor.icon}
                </motion.span>
                <div>
                  <span className="text-sm font-semibold text-gray-700">{factor.label}</span>
                  <p className="text-xs text-gray-500 mt-1">{factor.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Note Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            Add a note (optional)
          </label>
          <div className="relative">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-5 py-4 border border-[rgb(203,251,241)] rounded-xl shadow-xl shadow-teal-500/10 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white/90 backdrop-blur-sm hover:shadow-2xl hover:shadow-teal-500/20"
              rows={4}
              placeholder="How was your day? What made you feel this way?"
              maxLength={500}
            />
            <div className="absolute bottom-4 right-4 text-sm text-gray-400 font-medium">
              {note.length}/500
            </div>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          onClick={handleSubmit}
          disabled={!selectedMood || isSubmitting}
          whileHover={!selectedMood || isSubmitting ? {} : { scale: 1.02, y: -2 }}
          whileTap={!selectedMood || isSubmitting ? {} : { scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all ${
            !selectedMood || isSubmitting
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-xl shadow-teal-500/20 hover:shadow-2xl hover:shadow-teal-500/30'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              Saving your mood...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">✨</span>
              <span>Save Mood</span>
            </div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );

  const renderMoodHistory = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 p-8 border border-[rgb(203,251,241)]">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 mb-8">Mood History</h2>
        
        {moodHistory.length > 0 ? (
          <div className="space-y-4">
            {moodHistory.map((entry, index) => {
              const moodOption = moodOptions.find(m => m.value === entry.mood);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl shadow-teal-500/10 hover:shadow-2xl hover:shadow-teal-500/20 transition-all hover:-translate-y-1 transform perspective-1000"
                >
                  {/* Header with background color */}
                  <div className={`${moodOption?.color} bg-opacity-10 p-5`}>
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div className="flex items-center">
                        <motion.span 
                          className="text-3xl mr-3"
                          animate={{ 
                            rotate: [0, -12, 12, -12, 0],
                            scale: [1, 1.1, 1.1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3
                          }}
                        >
                          {moodOption?.emoji}
                        </motion.span>
                        <span className="font-semibold text-gray-800">{moodOption?.label}</span>
                      </div>
                      <span className="text-sm bg-white/90 backdrop-blur-sm text-gray-600 px-3 py-1.5 rounded-lg shadow-lg">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                    {/* Factors */}
                    {entry.factors && entry.factors.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {entry.factors.map(factorId => {
                          const factor = factors.find(f => f.id === factorId);
                          return factor ? (
                            <motion.span 
                              key={factorId} 
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 transition-colors group"
                              whileHover={{ scale: 1.05, y: -2 }}
                            >
                              <motion.span 
                                className="mr-2"
                                animate={{ 
                                  rotate: [0, -12, 12, -12, 0],
                                  scale: [1, 1.1, 1.1, 1.1, 1]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  repeatDelay: 3
                                }}
                              >
                                {factor.icon}
                              </motion.span>
                              {factor.label}
                            </motion.span>
                          ) : null;
                        })}
                      </div>
                    )}
                    
                    {/* Notes */}
                    {entry.notes && (
                      <p className="text-gray-600 text-sm leading-relaxed">{entry.notes}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl"
          >
            <motion.div 
              className="text-6xl mb-4"
              animate={{ 
                y: [0, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              📝
            </motion.div>
            <p className="text-gray-500 mb-6 text-lg">No mood entries yet</p>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('log')}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-lime-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:via-emerald-700 hover:to-lime-700 transition-all shadow-xl shadow-teal-500/20 hover:shadow-2xl hover:shadow-teal-500/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <span>Start tracking your mood</span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const renderInsights = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 p-8 border border-[rgb(203,251,241)]">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 mb-8">Mood Insights</h2>
        
        {moodHistory.length > 0 ? (
          <div className="space-y-8">
            {/* Mood Trend Analysis */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Trend</h3>
              <div className="bg-white/80 rounded-xl p-6 shadow-lg shadow-teal-500/5">
                <div className="flex items-center mb-4">
                  <motion.span 
                    className="text-4xl mr-3"
                    animate={{ 
                      rotate: [0, -12, 12, -12, 0],
                      scale: [1, 1.1, 1.1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    {getMoodTrend().includes('🔼') ? '🔼' : 
                     getMoodTrend().includes('🔽') ? '🔽' : 
                     '➡️'}
                  </motion.span>
                  <div>
                    <p className={`text-lg font-semibold ${
                      getMoodTrend().includes('🔼') ? 'text-emerald-600' : 
                      getMoodTrend().includes('🔽') ? 'text-rose-600' : 
                      'text-gray-600'
                    }`}>
                      {getMoodTrend()}
                    </p>
                    <p className="text-sm text-gray-500">Based on your recent entries</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Factor Analysis */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Factor Analysis</h3>
              <div className="space-y-4">
                {factors.map(factor => {
                  const factorMoods = moodHistory.filter(entry => 
                    entry.factors?.includes(factor.id)
                  );
                  const avgMood = factorMoods.length > 0
                    ? factorMoods.reduce((sum, entry) => {
                        const moodScore = moodOptions.find(m => m.value === entry.mood)?.score || 0;
                        return sum + moodScore;
                      }, 0) / factorMoods.length
                    : 0;
                  
                  return (
                    <motion.div
                      key={factor.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-white/80 rounded-xl p-6 shadow-lg shadow-teal-500/5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <motion.span 
                            className="text-2xl mr-3"
                            animate={{ 
                              rotate: [0, -12, 12, -12, 0],
                              scale: [1, 1.1, 1.1, 1.1, 1]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3
                            }}
                          >
                            {factor.icon}
                          </motion.span>
                          <div>
                            <p className="font-semibold text-gray-800">{factor.label}</p>
                            <p className="text-sm text-gray-500">{factorMoods.length} entries</p>
                          </div>
                        </div>
                        {avgMood > 0 && (
                          <div className="text-right">
                            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                              {avgMood.toFixed(1)}/5
                            </p>
                            <p className="text-sm text-gray-500">Average mood</p>
                          </div>
                        )}
                      </div>
                      {avgMood > 0 && (
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(avgMood / 5) * 100}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={`absolute top-0 left-0 h-full rounded-full ${
                              avgMood >= 4 ? 'bg-emerald-500' :
                              avgMood >= 3 ? 'bg-teal-500' :
                              avgMood >= 2 ? 'bg-yellow-500' :
                              'bg-rose-500'
                            }`}
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-white/80 rounded-xl p-6 shadow-lg shadow-teal-500/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-600">Average Mood</p>
                    <div className="flex items-center">
                      <motion.span 
                        className="text-2xl mr-2"
                        animate={{ 
                          rotate: [0, -12, 12, -12, 0],
                          scale: [1, 1.1, 1.1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3
                        }}
                      >
                        {getAverageMood(7) ? moodOptions.find(m => m.score === Math.round(getAverageMood(7) || 0))?.emoji : '📊'}
                      </motion.span>
                      <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                        {getAverageMood(7)?.toFixed(1) || '-'}/5
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Past 7 days</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-white/80 rounded-xl p-6 shadow-lg shadow-teal-500/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-600">Entries</p>
                    <div className="flex items-center">
                      <motion.span 
                        className="text-2xl mr-2"
                        animate={{ 
                          rotate: [0, -12, 12, -12, 0],
                          scale: [1, 1.1, 1.1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3
                        }}
                      >
                        📝
                      </motion.span>
                      <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                        {moodHistory.filter(entry => {
                          const date = new Date(entry.date);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - date.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays <= 7;
                        }).length}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Past 7 days</p>
                </motion.div>
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl"
          >
            <motion.div 
              className="text-6xl mb-4"
              animate={{ 
                y: [0, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              📊
            </motion.div>
            <p className="text-gray-500 mb-6 text-lg">No mood data available yet</p>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('log')}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-lime-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:via-emerald-700 hover:to-lime-700 transition-all shadow-xl shadow-teal-500/20 hover:shadow-2xl hover:shadow-teal-500/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <span>Start tracking your mood</span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

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
              Mood Tracker
            </h1>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </motion.div>

          {/* Mood stats summary */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/90 rounded-2xl shadow-lg shadow-teal-500/5 p-6 border border-[rgb(203,251,241)] backdrop-blur-sm"
            >
              <div className="flex items-center justify-center mb-3">
                <span className="text-3xl mr-3">
                  {getMoodTrend().includes('🔼') ? '🔼' : 
                   getMoodTrend().includes('🔽') ? '🔽' : 
                   '➡️'}
                </span>
                <span className={`text-lg font-semibold ${
                  getMoodTrend().includes('🔼') ? 'text-emerald-600' : 
                  getMoodTrend().includes('🔽') ? 'text-rose-600' : 
                  'text-amber-600'
                }`}>
                  {getMoodTrend().includes('🔼') ? 'Improving' : 
                   getMoodTrend().includes('🔽') ? 'Declining' : 
                   'Stable'}
                </span>
              </div>
              <div className="text-sm text-gray-500 text-center font-medium">Recent Trend</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/90 rounded-2xl shadow-lg shadow-teal-500/5 p-6 border border-[rgb(203,251,241)] backdrop-blur-sm"
            >
              <div className="flex items-center justify-center mb-3">
                <span className="text-3xl mr-3">
                  {getAverageMood(7) ? moodOptions.find(m => m.score === Math.round(getAverageMood(7) || 0))?.emoji : '📊'}
                </span>
                <span className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                  {getAverageMood(7) ? `${getAverageMood(7)}/5` : '-'}
                </span>
              </div>
              <div className="text-sm text-gray-500 text-center font-medium">7-Day Average</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/90 rounded-2xl shadow-lg shadow-teal-500/5 p-6 border border-[rgb(203,251,241)] backdrop-blur-sm"
            >
              <div className="flex items-center justify-center mb-3">
                <span className="text-3xl mr-3">
                  {getAverageMood(30) ? moodOptions.find(m => m.score === Math.round(getAverageMood(30) || 0))?.emoji : '📊'}
                </span>
                <span className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                  {getAverageMood(30) ? `${getAverageMood(30)}/5` : '-'}
                </span>
              </div>
              <div className="text-sm text-gray-500 text-center font-medium">30-Day Average</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/90 rounded-2xl shadow-lg shadow-teal-500/5 p-6 border border-[rgb(203,251,241)] backdrop-blur-sm"
            >
              <div className="flex items-center justify-center mb-3">
                <motion.span 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600"
                >
                  {moodHistory.length}
                </motion.span>
              </div>
              <div className="text-sm text-gray-500 text-center font-medium">Total Entries</div>
            </motion.div>
          </motion.div>

          {/* Main content area */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`col-span-1 ${view === 'log' ? 'lg:col-span-2' : ''}`}
            >
              {view === 'log' && renderMoodLog()}
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`col-span-1 ${view === 'insights' ? 'lg:col-span-2' : ''}`}
            >
              {view === 'insights' && renderInsights()}
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="col-span-1"
            >
              {renderMoodHistory()}
            </motion.div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 