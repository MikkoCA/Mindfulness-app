// OpenRouter API integration for AI capabilities

// Define the message format for OpenRouter API
export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterErrorResponse {
  error: {
    code: number;
    message: string;
    metadata?: Record<string, unknown>;
  };
}

// Helper function to check if response matches error type
function isOpenRouterError(data: any): data is OpenRouterErrorResponse {
  return (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    typeof data.error === 'object' &&
    'message' in data.error
  );
}

// Generate AI response using our server-side API route
export const generateAIResponse = async (messages: OpenRouterMessage[]): Promise<string> => {
  try {
    console.log('Sending request to OpenRouter via server API route');
    
    const response = await fetch('/api/openrouter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'google/gemini-2.0-pro-exp-02-05:free', // Using a reliable model that's available
        temperature: 0.7,
        maxTokens: 1000
      }),
      cache: 'no-store'
    });

    const data = await response.json();

    // Check for API errors
    if (!response.ok) {
      console.error('OpenRouter API error:', data);
      
      if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }
    }

    // Return the content from the response
    return data.content;
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
    console.log(`Generating ${duration}-minute ${type} mindfulness exercise`);
    
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are a mindfulness coach specializing in ${type} exercises. 
        Create a ${duration}-minute ${type} exercise that is calming and centering.
        
        Your response MUST be a valid JSON object with the following structure:
        {
          "title": "Title of the exercise",
          "description": "Brief description of the exercise",
          "duration": ${duration},
          "category": "${type}",
          "difficulty": "beginner|intermediate|advanced",
          "steps": [
            "Step 1 description",
            "Step 2 description",
            "..."
          ]
        }
        
        Do not include any text before or after the JSON. Return ONLY the JSON object.`
      },
      {
        role: 'user',
        content: `Create a ${duration}-minute ${type} exercise in JSON format. Make sure it's properly structured and includes all required fields.`
      }
    ];

    return await generateAIResponse(messages);
  } catch (error) {
    console.error(`Error generating ${type} exercise:`, error);
    throw new Error(`Failed to generate ${type} exercise: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to analyze user's mood based on their input
export const analyzeMood = async (userInput: string) => {
  try {
    console.log('Analyzing mood from user input');
    
    const systemPrompt = `You are an empathetic AI assistant trained to analyze emotional states from text. 
    Analyze the following text and determine the likely emotional state of the user. 
    Respond with a JSON object containing: mood (very_sad, sad, neutral, happy, very_happy) and a brief supportive message.`;
    
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ];
    
    const response = await generateAIResponse(messages);
    
    try {
      // Attempt to parse the response as JSON
      return JSON.parse(response);
    } catch (parseError) {
      console.error('Error parsing mood analysis response:', parseError);
      // Fallback response if parsing fails
      return {
        mood: 'neutral',
        message: 'Thank you for sharing your thoughts. Would you like to tell me more?'
      };
    }
  } catch (error) {
    console.error('Error analyzing mood:', error);
    return {
      mood: 'neutral',
      message: 'I apologize, but I couldn\'t analyze your mood at this time. How can I assist you today?'
    };
  }
}; 