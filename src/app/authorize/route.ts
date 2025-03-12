import { NextRequest, NextResponse } from 'next/server';

// This route handles Auth0's authorize endpoint redirection
export async function GET(request: NextRequest) {
  // Construct the Auth0 authorize URL with all required parameters
  const auth0Domain = 'dev-gpya6w7bujdxiibs.us.auth0.com';
  const clientId = 'uTKAd4iRzETMA7q7nsJGcKsOBMVkbRZQ';
  const redirectUri = `https://mindfulness-app-ngpm.vercel.app/api/auth/callback`;
  const responseType = 'code';
  const scope = 'openid profile email';
  
  const authorizeUrl = `https://${auth0Domain}/authorize?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=${responseType}` +
    `&scope=${encodeURIComponent(scope)}`;
  
  // Redirect directly to Auth0's authorize endpoint
  return NextResponse.redirect(authorizeUrl);
} 