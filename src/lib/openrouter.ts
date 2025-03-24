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
        model: 'google/gemini-2.0-flash-001', // Using a reliable model that's available
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
    // Validate exercise type
    const validTypes = ['breathing', 'meditation', 'body-scan', 'mindful-walking', 'gratitude', 'visualization', 'other'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid exercise type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate duration
    if (duration < 1 || duration > 60) {
      throw new Error('Duration must be between 1 and 60 minutes');
    }

    console.log(`Generating ${duration}-minute ${type} mindfulness exercise`);
    
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are a mindfulness coach specializing in ${type.replace('-', ' ')} exercises. 
        Create a ${duration}-minute ${type.replace('-', ' ')} exercise that is calming and centering.
        
        CRITICAL: You must return a raw JSON object WITHOUT any markdown formatting, code blocks, or backticks.
        The response must be EXACTLY in this format (no additional text or formatting):
        {
          "title": "Title of the exercise",
          "description": "Brief description of the exercise",
          "duration": ${duration},
          "category": "${type}",
          "difficulty": "beginner",
          "steps": [
            "Step 1 description",
            "Step 2 description",
            "..."
          ]
        }
        
        STRICT RULES:
        1. NO markdown formatting (no \`\`\`, no code blocks)
        2. NO text before or after the JSON
        3. NO comments or explanations
        4. ONLY the raw JSON object
        5. All fields must be present
        6. Use double quotes for strings
        7. No trailing commas
        8. Steps must be an array of strings
        9. Duration must be ${duration}
        10. Category must be "${type}"
        11. Difficulty must be "beginner"`
      },
      {
        role: 'user',
        content: `Create a ${duration}-minute ${type} exercise. Return ONLY a raw JSON object without any formatting or markdown.`
      }
    ];

    const response = await generateAIResponse(messages);
    
    // Clean the response of any markdown formatting
    let cleanedResponse = response
      // Remove markdown code block syntax
      .replace(/```(?:json|javascript|js)?\s*/g, '')
      .replace(/\s*```\s*/g, '')
      // Remove any backticks
      .replace(/`/g, '')
      // Trim whitespace
      .trim();

    // Validate JSON response
    try {
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate required fields and types
      if (!parsed.title || typeof parsed.title !== 'string') {
        throw new Error('Missing or invalid title');
      }
      if (!parsed.description || typeof parsed.description !== 'string') {
        throw new Error('Missing or invalid description');
      }
      if (!parsed.duration || parsed.duration !== duration) {
        throw new Error('Missing or incorrect duration');
      }
      if (!parsed.category || parsed.category !== type) {
        throw new Error('Missing or incorrect category');
      }
      if (!parsed.difficulty || parsed.difficulty !== 'beginner') {
        throw new Error('Missing or incorrect difficulty');
      }
      if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        throw new Error('Missing or invalid steps array');
      }
      if (!parsed.steps.every((step: unknown) => typeof step === 'string')) {
        throw new Error('Steps must be strings');
      }

      return cleanedResponse;
    } catch (parseError) {
      console.error('Raw response:', response);
      console.error('Cleaned response:', cleanedResponse);
      throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
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