import { NextResponse } from 'next/server';
import { OpenRouterMessage } from '@/lib/openrouter';

// This route handles OpenRouter API calls and does not require authentication

export async function POST(request: Request) {
  try {
    // Get request body
    const { messages, model = 'google/gemini-2.0-flash-001', temperature = 0.7, maxTokens = 10000 } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages must be an array' },
        { status: 400 }
      );
    }

    // Get API key from server environment (not exposed to client)
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('[OpenRouter API] API key not configured in environment');
      return NextResponse.json(
        { error: 'OpenRouter API configuration missing' },
        { status: 500 }
      );
    }

    console.log(`[OpenRouter API] Request - model: ${model}, messages: ${messages.length}`);
    
    try {
      // Make request to OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Mindfulness Chatbot'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens
        })
      });

      const data = await response.json();

      // Handle API errors
      if (!response.ok) {
        console.error('[OpenRouter API] Error response:', data);
        return NextResponse.json(
          { 
            error: data.error?.message || `API error: ${response.status}`,
            details: data
          },
          { status: response.status }
        );
      }

      // Check for valid response format
      if (!data.choices?.[0]?.message?.content) {
        console.error('[OpenRouter API] Invalid response format:', data);
        return NextResponse.json(
          { error: 'Invalid response format from AI provider' },
          { status: 500 }
        );
      }

      // Return successful response
      return NextResponse.json({
        content: data.choices[0].message.content,
        model: data.model,
        id: data.id
      });
      
    } catch (fetchError) {
      console.error('[OpenRouter API] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to communicate with OpenRouter API' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[OpenRouter API] General error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 