'use client';

import { useState } from 'react';
import { MoodEntry } from '@/types';

interface MoodTrackerProps {
  initialEntries?: MoodEntry[];
  onAddEntry?: (entry: MoodEntry) => void;
}

const MoodTracker = ({ initialEntries = [], onAddEntry }: MoodTrackerProps) => {
  const [entries, setEntries] = useState<MoodEntry[]>(initialEntries);
  const [selectedMood, setSelectedMood] = useState<MoodEntry['mood'] | null>(null);
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleAddEntry = () => {
    if (!selectedMood) return;

    // Get numeric value for the mood
    const moodValues = {
      'very_happy': 5,
      'happy': 4,
      'neutral': 3,
      'sad': 2,
      'very_sad': 1
    };

    const now = new Date();
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      userId: 'user123', // This would come from authentication in a real app
      mood: selectedMood,
      moodValue: moodValues[selectedMood],
      date: now.toISOString().split('T')[0], // Format: YYYY-MM-DD
      notes: notes.trim() || undefined,
      timestamp: now,
    };

    setEntries([newEntry, ...entries]);
    onAddEntry?.(newEntry);
    
    // Reset form
    setSelectedMood(null);
    setNotes('');
    setShowForm(false);
  };

  const getMoodEmoji = (mood: MoodEntry['mood']) => {
    switch (mood) {
      case 'very_happy': return '😄';
      case 'happy': return '🙂';
      case 'neutral': return '😐';
      case 'sad': return '🙁';
      case 'very_sad': return '😢';
      default: return '❓';
    }
  };

  const getMoodColor = (mood: MoodEntry['mood']) => {
    switch (mood) {
      case 'very_happy': return 'bg-green-500';
      case 'happy': return 'bg-green-300';
      case 'neutral': return 'bg-yellow-300';
      case 'sad': return 'bg-orange-300';
      case 'very_sad': return 'bg-red-300';
      default: return 'bg-gray-300';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
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
          <div className="flex justify-between mb-6">
            {(['very_sad', 'sad', 'neutral', 'happy', 'very_happy'] as const).map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                  selectedMood === mood ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                } ${getMoodColor(mood)}`}
              >
                {getMoodEmoji(mood)}
              </button>
            ))}
          </div>
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
          <button
            onClick={handleAddEntry}
            disabled={!selectedMood}
            className={`w-full py-2 rounded-md ${
              selectedMood
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save Entry
          </button>
        </div>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No mood entries yet. Add your first one!</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-center border-b pb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${getMoodColor(entry.mood)}`}>
                {getMoodEmoji(entry.mood)}
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex justify-between">
                  <span className="font-medium capitalize">{entry.mood.replace('_', ' ')}</span>
                  <span className="text-gray-500 text-sm">{formatDate(entry.timestamp)}</span>
                </div>
                {entry.notes && <p className="text-gray-600 mt-1">{entry.notes}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MoodTracker; 