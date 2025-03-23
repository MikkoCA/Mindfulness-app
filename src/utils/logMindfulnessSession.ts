import { createClient } from '@/lib/supabase/client';

type MindfulnessSessionData = {
  userId: string;
  durationMinutes: number;
  sessionType: string;
  notes?: string;
  moodBefore?: number;
  moodAfter?: number;
  tags?: string[];
};

/**
 * Logs a mindfulness session to the database
 * @param sessionData The session data to log
 * @returns The ID of the created session or null if there was an error
 */
export async function logMindfulnessSession(sessionData: MindfulnessSessionData): Promise<string | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('mindfulness_sessions')
      .insert({
        user_id: sessionData.userId,
        duration_minutes: sessionData.durationMinutes,
        session_type: sessionData.sessionType,
        notes: sessionData.notes,
        mood_before: sessionData.moodBefore,
        mood_after: sessionData.moodAfter,
        tags: sessionData.tags
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error logging mindfulness session:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error logging mindfulness session:', error);
    return null;
  }
}

/**
 * Updates an existing mindfulness session in the database
 * @param sessionId The ID of the session to update
 * @param sessionData The updated session data
 * @returns True if the update was successful, false otherwise
 */
export async function updateMindfulnessSession(
  sessionId: string, 
  sessionData: Partial<Omit<MindfulnessSessionData, 'userId'>>
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const updateData: Record<string, any> = {};
    
    if (sessionData.durationMinutes !== undefined) {
      updateData.duration_minutes = sessionData.durationMinutes;
    }
    
    if (sessionData.sessionType !== undefined) {
      updateData.session_type = sessionData.sessionType;
    }
    
    if (sessionData.notes !== undefined) {
      updateData.notes = sessionData.notes;
    }
    
    if (sessionData.moodBefore !== undefined) {
      updateData.mood_before = sessionData.moodBefore;
    }
    
    if (sessionData.moodAfter !== undefined) {
      updateData.mood_after = sessionData.moodAfter;
    }
    
    if (sessionData.tags !== undefined) {
      updateData.tags = sessionData.tags;
    }
    
    const { error } = await supabase
      .from('mindfulness_sessions')
      .update(updateData)
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error updating mindfulness session:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating mindfulness session:', error);
    return false;
  }
}

/**
 * Deletes a mindfulness session from the database
 * @param sessionId The ID of the session to delete
 * @returns True if the deletion was successful, false otherwise
 */
export async function deleteMindfulnessSession(sessionId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('mindfulness_sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error deleting mindfulness session:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting mindfulness session:', error);
    return false;
  }
} 