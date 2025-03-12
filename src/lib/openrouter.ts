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
    EXTREMELY IMPORTANT: Return ONLY a raw JSON object WITHOUT any explanations, markdown, or formatting.
    DO NOT wrap the JSON in code blocks, backticks, or any other syntax.
    The response must be valid JSON that can be directly parsed.
    Format:
    {
      "title": "Exercise Name",
      "description": "Brief description of the exercise",
      "duration": ${duration},
      "category": "${type}",
      "difficulty": "beginner" | "intermediate" | "advanced"
    }`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create a ${duration}-minute ${type} exercise as a valid JSON object only` }
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
      console.error('OpenRouter API error response:', errorData);
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    // eslint-disable-next-line prefer-const
    const content = data.choices[0].message.content;
    
    // Clean the response of any markdown formatting
    if (content.includes('```')) {
      return content
        .replace(/```(?:json|javascript|js|plaintext)?\s*([\s\S]*?)\s*```/g, '$1')
        .replace(/`/g, '')
        .trim();
    }
    
    return content;
    
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
  
  return await generateAIResponse([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput }
  ]);
}; 