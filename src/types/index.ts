export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  meditationDuration: number;
  preferredExercises: string[];
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'custom';
  customSchedule?: string[];
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'error' | 'initial';
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: 'meditation' | 'breathing' | 'mindfulness';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  benefits: string[];
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad';
  moodValue: number;
  date: string;
  timestamp: Date;
  notes?: string;
  factors?: string[];
}

export interface ActivityLog {
  id: string;
  type: 'exercise' | 'mood' | 'chat';
  date: string;
  details: string;
}

export interface Session {
  id: string;
  userId: string;
  exerciseId: string;
  duration: number;
  completed: boolean;
  notes?: string;
  timestamp: Date;
}