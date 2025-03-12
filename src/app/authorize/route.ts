import { NextRequest, NextResponse } from 'next/server';

// This route handles Auth0's authorize endpoint redirection
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Just redirect to the login page which will handle the Auth0 flow
  return NextResponse.redirect(new URL('/auth/login', request.url));
} 