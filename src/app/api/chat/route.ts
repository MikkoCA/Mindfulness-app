import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, model = 'openai/gpt-3.5-turbo' } = body;

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OpenRouter API key is missing');
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 }
      );
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://mindfulness-app-ngpm.vercel.app',
          'X-Title': 'Mindfulness Chatbot'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      // Log response headers for debugging
      console.log('OpenRouter response status:', response.status);
      console.log('OpenRouter response headers:', Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch {
          errorData = { rawError: errorText };
        }
        
        console.error('OpenRouter API error:', errorData);
        return NextResponse.json(
          { 
            error: errorData.error?.message || `API request failed with status ${response.status}`,
            details: errorData
          },
          { status: response.status }
        );
      }

      try {
        const data = await response.json();
        
        // Validate response format
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
          console.error('Invalid response format from OpenRouter:', data);
          return NextResponse.json(
            { 
              error: 'Invalid response format from AI provider',
              details: data
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(data);
      } catch (parseError) {
        console.error('Error parsing OpenRouter response:', parseError);
        return NextResponse.json(
          { 
            error: 'Error parsing response from AI provider',
            details: parseError instanceof Error ? parseError.message : String(parseError)
          },
          { status: 500 }
        );
      }
    } catch (fetchError) {
      console.error('Fetch error when contacting OpenRouter:', fetchError);
      return NextResponse.json(
        { 
          error: 'Error connecting to AI provider',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 