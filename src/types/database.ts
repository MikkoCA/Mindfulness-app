// Define database types for Supabase schema

export type MoodLabel = 'very_low' | 'low' | 'neutral' | 'good' | 'great';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseCategory = 'breathing' | 'meditation' | 'body-scan' | 'walking' | 'gratitude' | 'visualization' | 'other';
export type ActivityType = 'exercise_completed' | 'mood_tracked' | 'chat_session' | 'login' | 'goal_achieved';
export type GoalStatus = 'in_progress' | 'completed' | 'abandoned';
export type ThemeOption = 'light' | 'dark' | 'system';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  difficulty_level: DifficultyLevel;
  category: ExerciseCategory;
  instructions: string;
  benefits?: string;
  image_url?: string;
  audio_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood_score: number;
  mood_label: MoodLabel;
  notes?: string;
  factors: string[];
  recorded_at: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  exercise_id?: string;
  activity_type: ActivityType;
  duration_minutes?: number;
  notes?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  session_id: string;
  is_user_message: boolean;
  message_text: string;
  context?: any;
  created_at: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_date?: string;
  status: GoalStatus;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    reminders: boolean;
  };
  theme: ThemeOption;
  meditation_reminder_time?: string;
  language: string;
  created_at: string;
  updated_at: string;
}

// Type definitions for database functions
export interface SupabaseFunctions {
  record_mood: (
    user_uuid: string,
    mood_score_val: number,
    mood_label_val: MoodLabel,
    notes_val?: string,
    factors_val?: string[]
  ) => Promise<string>; // Returns UUID
  
  complete_exercise: (
    user_uuid: string,
    exercise_uuid: string,
    duration_min: number,
    notes_val?: string
  ) => Promise<string>; // Returns UUID
  
  log_user_activity: (
    user_uuid: string,
    activity_type_val: ActivityType,
    exercise_uuid?: string,
    duration_min?: number,
    notes_val?: string
  ) => Promise<string>; // Returns UUID
} 