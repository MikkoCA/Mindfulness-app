import { logMindfulnessSession } from '@/utils/logMindfulnessSession';

/**
 * Checks if a message indicates the end of a session
 * @param message The message to check
 * @returns True if the message indicates the end of a session
 */
export function isSessionEndMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('thank you') || 
    lowerMessage.includes('thanks') ||
    lowerMessage.includes('goodbye') ||
    lowerMessage.includes('bye') ||
    lowerMessage.includes('end session') ||
    lowerMessage.includes('finish session')
  );
}

/**
 * Logs a completed mindfulness session based on chat messages
 * @param userId The user ID
 * @param messageCount The number of messages in the session
 * @param sessionType The type of session (defaults to 'Chat Meditation')
 * @returns The ID of the logged session or null if there was an error
 */
export async function logCompletedChatSession(
  userId: string,
  messageCount: number,
  sessionType: string = 'Chat Meditation'
): Promise<string | null> {
  try {
    // Calculate approximate duration (assuming 1 minute per message exchange)
    const durationMinutes = Math.max(5, Math.ceil(messageCount / 2) * 5);
    
    // Log the mindfulness session
    return await logMindfulnessSession({
      userId,
      durationMinutes,
      sessionType,
      notes: `Chat session with ${messageCount} messages`
    });
  } catch (error) {
    console.error('Error logging completed chat session:', error);
    return null;
  }
} 