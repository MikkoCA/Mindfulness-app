import { User as SupabaseUser } from '@supabase/supabase-js'

export interface AppUser {
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
  category: 'breathing' | 'meditation' | 'other';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
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
  type: 'mood' | 'exercise' | 'chat';
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

export type { SupabaseUser as User }