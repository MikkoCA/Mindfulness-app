import { NextResponse } from 'next/server';

// A simple GET endpoint to test the OpenRouter API key - no auth required
export async function GET() {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('[OpenRouter Test] API key not found in environment variables');
      return NextResponse.json(
        { 
          success: false, 
          message: 'API key not found in environment variables',
          env_vars_available: Object.keys(process.env).some(key => 
            key.includes('OPEN') || key.includes('API')
          )
        },
        { status: 500 }
      );
    }
    
    try {
      // Test the API key by making a minimal request to OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[OpenRouter Test] API key test failed:', errorData);
        return NextResponse.json(
          { 
            success: false, 
            message: 'API key test failed',
            status: response.status,
            error: errorData
          },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      console.log('[OpenRouter Test] API key test successful');
      
      return NextResponse.json({
        success: true,
        message: 'API key is valid',
        models_available: data.data?.length || 0
      });
    } catch (fetchError) {
      console.error('[OpenRouter Test] Fetch error:', fetchError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error connecting to OpenRouter API',
          error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('[OpenRouter Test] General error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error testing API key',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 