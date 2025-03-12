// OpenRouter API integration for AI capabilities

// Initialize the OpenRouter client
export const initOpenRouter = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('OpenRouter API key is not defined in environment variables');
    return null;
  }
  
  return {
    apiKey,
    baseUrl: 'https://openrouter.ai/api/v1',
  };
};

// Define the message format for OpenRouter API
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Generate AI response using our API route
export const generateAIResponse = async (
  messages: ChatMessage[],
  model: string = 'google/gemini-2.0-flash-001'
): Promise<string> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};

// Function to generate a mindfulness exercise
export const generateMindfulnessExercise = async (
  type: string, 
  duration: number
): Promise<string> => {
  try {
    const systemPrompt = `You are a mindfulness coach specializing in ${type} exercises. 
    Create a ${duration}-minute ${type} exercise that is calming and centering. 
    Format the response as a JSON object with the following structure:
    {
      "title": "Exercise Name",
      "description": "Brief description of the exercise",
      "duration": ${duration},
      "category": "${type}",
      "difficulty": "beginner" | "intermediate" | "advanced"
    }`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create a ${duration}-minute ${type} exercise` }
    ];
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('Error generating mindfulness exercise:', error);
    throw error;
  }
};

// Function to analyze user's mood based on their input
export const analyzeMood = async (userInput: string) => {
  const systemPrompt = `You are an empathetic AI assistant trained to analyze emotional states from text. 
  Analyze the following text and determine the likely emotional state of the user. 
  Respond with a JSON object containing: mood (very_sad, sad, neutral, happy, very_happy) and a brief supportive message.`;
  
  return generateAIResponse([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput }
  ]);
}; 

// Simulate AI responses based on keywords (for development only)
const simulateAIResponse = (userMessage: string, userName: string | null): string => {
  const lowerCaseMessage = userMessage.toLowerCase();
  const greeting = userName ? `${userName}` : '';
  
  if (lowerCaseMessage.includes('stressed') || lowerCaseMessage.includes('anxiety') || lowerCaseMessage.includes('anxious')) {
    return `I understand you're feeling stressed${greeting ? ', ' + greeting : ''}. Let's try a quick breathing exercise called "4-7-8 breathing":

1. Find a comfortable position and close your eyes if possible
2. Inhale quietly through your nose for 4 seconds
3. Hold your breath for 7 seconds
4. Exhale completely through your mouth for 8 seconds
5. Repeat this cycle 4 times

This technique helps activate your parasympathetic nervous system, which helps reduce stress. Would you like to try another technique after this?`;
  } 
  
  if (lowerCaseMessage.includes('meditation') || lowerCaseMessage.includes('meditate')) {
    return `I'd be happy to guide you through a brief meditation${greeting ? ', ' + greeting : ''}:

1. Find a comfortable seated position with your back straight
2. Close your eyes or maintain a soft gaze
3. Take three deep breaths, in through your nose and out through your mouth
4. Now, bring your attention to your natural breathing pattern
5. Notice the sensation of air entering and leaving your body
6. When your mind wanders (which is normal), gently bring your focus back to your breath
7. Continue this practice for 5 minutes

How does that feel? Would you like a longer guided meditation next time?`;
  }
  
  if (lowerCaseMessage.includes('breathing') || lowerCaseMessage.includes('breath')) {
    return `Here's a simple box breathing exercise${greeting ? ' for you, ' + greeting : ''}:

1. Sit comfortably with your back straight
2. Exhale completely through your mouth
3. Inhale through your nose for 4 counts
4. Hold your breath for 4 counts
5. Exhale through your mouth for 4 counts
6. Hold your breath for 4 counts
7. Repeat this cycle 4 times

This technique is used by many, including Navy SEALs, to reduce stress and improve focus. How do you feel after trying it?`;
  }
  
  if (lowerCaseMessage.includes('sleep') || lowerCaseMessage.includes('insomnia')) {
    return `I'm sorry to hear you're having trouble sleeping${greeting ? ', ' + greeting : ''}. Here are some mindfulness techniques that might help:

1. Body scan meditation: Starting from your toes, gradually bring awareness to each part of your body, relaxing each area
2. 4-7-8 breathing: Inhale for 4 seconds, hold for 7, exhale for 8
3. Visualization: Imagine a peaceful place in detail, engaging all your senses
4. Progressive muscle relaxation: Tense and then release each muscle group

Would you like me to guide you through any of these techniques?`;
  }
  
  if (lowerCaseMessage.includes('work') || lowerCaseMessage.includes('job') || lowerCaseMessage.includes('office')) {
    return `Practicing mindfulness at work can be very beneficial${greeting ? ', ' + greeting : ''}. Here are some simple techniques:

1. Take mindful breaks: Set a timer for 2 minutes every hour to focus on your breathing
2. Single-tasking: Focus on one task at a time, giving it your full attention
3. Mindful listening: During meetings, really focus on what others are saying without planning your response
4. Desk stretches: Take short breaks to stretch and reconnect with your body
5. Gratitude practice: Note three things you appreciate about your work each day

Which of these would you like to explore further?`;
  }
  
  return `I'm here to help you with mindfulness practices, meditation guidance, and stress reduction techniques${greeting ? ', ' + greeting : ''}. 

Some areas I can assist with:
• Guided meditations
• Breathing exercises
• Stress management techniques
• Mindfulness for specific situations (work, sleep, etc.)
• General mental wellness advice

What specific area would you like help with today?`;
}; 