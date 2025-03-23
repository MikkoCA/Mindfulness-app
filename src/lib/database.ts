import { supabase } from '@/lib/supabase';
import { 
  ActivityType, 
  MoodLabel, 
  Exercise, 
  MoodEntry, 
  ActivityLog, 
  ChatMessage, 
  UserGoal, 
  UserSettings 
} from '@/types/database';

// Exercises
export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('title', { ascending: true });
  
  if (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
  
  return data || [];
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching exercise ${id}:`, error);
    return null;
  }
  
  return data;
}

// Mood Entries
export async function getMoodEntries(userId: string): Promise<MoodEntry[]> {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching mood entries:', error);
    throw error;
  }
  
  return data || [];
}

export async function createMoodEntry(
  userId: string,
  moodScore: number,
  moodLabel: MoodLabel,
  notes?: string,
  factors?: string[]
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('record_mood', {
      user_uuid: userId,
      mood_score_val: moodScore,
      mood_label_val: moodLabel,
      notes_val: notes || null,
      factors_val: factors || []
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating mood entry:', error);
    throw error;
  }
}

// Activity Logs
export async function getActivityLogs(userId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
  
  return data || [];
}

export async function logUserActivity(
  userId: string,
  activityType: ActivityType,
  exerciseId?: string,
  durationMinutes?: number,
  notes?: string
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('log_user_activity', {
      user_uuid: userId,
      activity_type_val: activityType,
      exercise_uuid: exerciseId || null,
      duration_min: durationMinutes || null,
      notes_val: notes || null
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}

export async function completeExercise(
  userId: string,
  exerciseId: string,
  durationMinutes: number,
  notes?: string
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('complete_exercise', {
      user_uuid: userId,
      exercise_uuid: exerciseId,
      duration_min: durationMinutes,
      notes_val: notes || null
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error completing exercise:', error);
    throw error;
  }
}

// Chat Messages
export async function getChatMessages(userId: string, sessionId?: string): Promise<ChatMessage[]> {
  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId);
  
  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
  
  return data || [];
}

export async function getRecentChatSession(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('session_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('Error fetching recent chat session:', error);
    throw error;
  }
  
  return data && data.length > 0 ? data[0].session_id : null;
}

export async function createChatSession(userId: string | 'guest'): Promise<string> {
  // Generate a new UUID for the session
  const sessionId = crypto.randomUUID();
  
  // Log this activity only for authenticated users
  if (userId !== 'guest') {
    await logUserActivity(userId, 'chat_session' as ActivityType);
  }
  
  return sessionId;
}

export async function createChatMessage(
  userId: string | 'guest',
  sessionId: string,
  messageText: string,
  isUserMessage: boolean = true,
  context: any = {}
): Promise<ChatMessage> {
  // For guest users, return a local message without saving to database
  if (userId === 'guest') {
    return {
      id: crypto.randomUUID(),
      user_id: 'guest',
      session_id: sessionId,
      message_text: messageText,
      is_user_message: isUserMessage,
      context: context,
      created_at: new Date().toISOString()
    };
  }

  // For authenticated users, save to database
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      session_id: sessionId,
      message_text: messageText,
      is_user_message: isUserMessage,
      context: context
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating chat message:', error);
    throw error;
  }
  
  return data;
}

// User Goals
export async function getUserGoals(userId: string): Promise<UserGoal[]> {
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user goals:', error);
    throw error;
  }
  
  return data || [];
}

export async function createUserGoal(
  userId: string,
  title: string,
  description?: string,
  targetDate?: string
): Promise<UserGoal> {
  const { data, error } = await supabase
    .from('user_goals')
    .insert({
      user_id: userId,
      title,
      description,
      target_date: targetDate,
      status: 'in_progress',
      progress: 0
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user goal:', error);
    throw error;
  }
  
  return data;
}

export async function updateGoalProgress(
  goalId: string,
  progress: number,
  status?: 'in_progress' | 'completed' | 'abandoned'
): Promise<UserGoal> {
  const updates: any = { progress };
  if (status) {
    updates.status = status;
  }
  
  const { data, error } = await supabase
    .from('user_goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating goal progress:', error);
    throw error;
  }
  
  return data;
}

// User Settings
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    console.error('Error fetching user settings:', error);
    throw error;
  }
  
  return data;
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .update(settings)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
  
  return data;
} 