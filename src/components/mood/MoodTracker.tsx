'use client';

import { useState } from 'react';
import { MoodEntry, MoodLabel } from '@/types/database';
import { createMoodEntry } from '@/lib/database';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface MoodTrackerProps {
  userId: string;
  initialEntries?: MoodEntry[];
}

const MoodTracker = ({ userId, initialEntries = [] }: MoodTrackerProps) => {
  const [entries, setEntries] = useState<MoodEntry[]>(initialEntries);
  const [selectedMood, setSelectedMood] = useState<MoodLabel | null>(null);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [factors, setFactors] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAddEntry = async () => {
    if (!selectedMood || !moodScore) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Call the Supabase function to create the mood entry
      await createMoodEntry(
        userId,
        moodScore,
        selectedMood,
        notes.trim() || undefined,
        factors.length > 0 ? factors : undefined
      );
      
      // Refresh to get updated data
      router.refresh();
      
      // Reset form
      setSelectedMood(null);
      setMoodScore(null);
      setNotes('');
      setFactors([]);
      setShowForm(false);
    } catch (err) {
      console.error('Error creating mood entry:', err);
      setError('Failed to save your mood entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoodSelection = (mood: MoodLabel, score: number) => {
    setSelectedMood(mood);
    setMoodScore(score);
  };

  const handleFactorToggle = (factor: string) => {
    if (factors.includes(factor)) {
      setFactors(factors.filter(f => f !== factor));
    } else {
      setFactors([...factors, factor]);
    }
  };

  const getMoodEmoji = (mood: MoodLabel) => {
    switch (mood) {
      case 'very_low': return '😢';
      case 'low': return '🙁';
      case 'neutral': return '😐';
      case 'good': return '🙂';
      case 'great': return '😄';
      default: return '❓';
    }
  };

  const getMoodColor = (mood: MoodLabel) => {
    switch (mood) {
      case 'very_low': return 'bg-red-300';
      case 'low': return 'bg-orange-300';
      case 'neutral': return 'bg-yellow-300';
      case 'good': return 'bg-green-300';
      case 'great': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Mood Tracker</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Entry'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">How are you feeling today?</h3>
          
          {/* Mood selection */}
          <div className="flex justify-between mb-6">
            <button
              onClick={() => handleMoodSelection('very_low', 1)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                selectedMood === 'very_low' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              } bg-red-300`}
            >
              😢
            </button>
            <button
              onClick={() => handleMoodSelection('low', 3)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                selectedMood === 'low' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              } bg-orange-300`}
            >
              🙁
            </button>
            <button
              onClick={() => handleMoodSelection('neutral', 5)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                selectedMood === 'neutral' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              } bg-yellow-300`}
            >
              😐
            </button>
            <button
              onClick={() => handleMoodSelection('good', 8)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                selectedMood === 'good' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              } bg-green-300`}
            >
              🙂
            </button>
            <button
              onClick={() => handleMoodSelection('great', 10)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                selectedMood === 'great' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              } bg-green-500`}
            >
              😄
            </button>
          </div>
          
          {/* Factors section */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Factors (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {['work', 'family', 'health', 'sleep', 'exercise', 'meditation', 'weather'].map((factor) => (
                <button
                  key={factor}
                  onClick={() => handleFactorToggle(factor)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    factors.includes(factor)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {factor}
                </button>
              ))}
            </div>
          </div>
          
          {/* Notes section */}
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="What's on your mind today?"
            ></textarea>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mb-4 text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          {/* Submit button */}
          <button
            onClick={handleAddEntry}
            disabled={!selectedMood || isSubmitting}
            className={`w-full py-2 rounded-md ${
              selectedMood && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No mood entries yet. Add your first one!</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-center border-b pb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${getMoodColor(entry.mood_label)}`}>
                {getMoodEmoji(entry.mood_label)}
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex justify-between">
                  <span className="font-medium capitalize">{entry.mood_label.replace('_', ' ')}</span>
                  <span className="text-gray-500 text-sm">{formatDate(entry.recorded_at)}</span>
                </div>
                {entry.notes && <p className="text-gray-600 mt-1">{entry.notes}</p>}
                {entry.factors && entry.factors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.factors.map((factor) => (
                      <span key={factor} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {factor}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MoodTracker; 