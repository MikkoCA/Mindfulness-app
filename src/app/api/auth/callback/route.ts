import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  // If there's no code, this isn't a valid callback
  if (!code) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  try {
    // Exchange the code for tokens with Auth0
    const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/auth/login?error=token_exchange', request.url));
    }
    
    // Get user profile
    const userResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });
    
    const userData = await userResponse.json();
    
    if (!userResponse.ok) {
      console.error('User profile fetch failed:', userData);
      return NextResponse.redirect(new URL('/auth/login?error=user_profile', request.url));
    }
    
    // Create a session cookie or store user data
    // For simplicity, we'll redirect to the home page with success
    return NextResponse.redirect(new URL('/?auth=success', request.url));
    
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=server', request.url));
  }
} 