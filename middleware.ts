// Auth0 Middleware
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    console.log('Middleware executing for path:', {
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString()
    });
    
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    
    // Try to refresh the session - this is the key part that fixes the AuthSessionMissingError
    await supabase.auth.getSession();
    
    // Try to get session
    let session = null;
    let sessionError = null;
    try {
      const { data, error } = await supabase.auth.getSession();
      session = data.session;
      sessionError = error;
      
      console.log('Auth session check result:', {
        hasSession: !!session,
        hasError: !!sessionError,
        userId: session?.user?.id,
        path: request.nextUrl.pathname,
        timestamp: new Date().toISOString()
      });
      
      if (error) {
        console.error('Error getting session in middleware:', {
          errorMessage: error.message,
          errorName: error.name,
          path: request.nextUrl.pathname,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      // Ignore cookie parsing errors
      if (!error.message?.includes('Failed to parse cookie') && 
          !error.message?.includes('base64-eyJ')) {
        console.error('Exception getting session in middleware:', {
          errorMessage: error.message,
          errorStack: error.stack,
          path: request.nextUrl.pathname,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Check if we're accessing a protected route
    const isProtectedRoute = 
      request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/ai-chat');
    const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
    
    // If accessing a protected route and not signed in, redirect to login
    if (isProtectedRoute && !session) {
      console.log('Redirecting to login from protected route:', {
        fromPath: request.nextUrl.pathname,
        timestamp: new Date().toISOString()
      });
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // If accessing auth routes but already signed in, redirect to dashboard
    if (isAuthRoute && session && !request.nextUrl.pathname.startsWith('/auth/signout')) {
      console.log('Redirecting to dashboard from auth route:', {
        fromPath: request.nextUrl.pathname,
        userId: session.user.id,
        timestamp: new Date().toISOString()
      });
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    return res;
  } catch (error: any) {
    // Ignore cookie parsing errors
    if (!error.message?.includes('Failed to parse cookie') && 
        !error.message?.includes('base64-eyJ')) {
      console.error('Unhandled error in middleware:', {
        errorMessage: error.message,
        errorStack: error.stack,
        path: request.nextUrl.pathname,
        timestamp: new Date().toISOString()
      });
    }
    
    // Return next response to avoid breaking the app
    return NextResponse.next();
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}; 