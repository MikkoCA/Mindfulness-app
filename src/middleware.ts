import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/ai-chat',
  '/auth/profile'
];

// Define routes that should bypass auth checks entirely
const publicApiRoutes = [
  '/api/openrouter',
  '/api/openrouter/test'
];

// Routes that use client-side auth only (no middleware protection)
const clientSideAuthRoutes = [
  '/exercises',
  '/mood-tracker'
];

// Helper function to check if an error is a cookie parsing error that we want to ignore
const isCookieParsingError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('Failed to parse cookie') || 
           error.message.includes('base64-eyJ');
  }
  return false;
};

export async function middleware(req: NextRequest) {
  // First check if this is a public API route that should bypass auth entirely
  if (publicApiRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check if this is a client-side auth route (exercises or mood-tracker)
  // These will be protected by the AuthGuard component instead of middleware
  if (clientSideAuthRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // First refresh the session - this is the key part that fixes the AuthSessionMissingError
    await supabase.auth.getSession();

    // Check if the route requires authentication
    const isProtectedRoute = protectedRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    );

    // Only perform auth checks if this is a protected route
    if (isProtectedRoute) {
      try {
        // Get the session after refresh
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Redirect to login if accessing protected route without session
          const redirectUrl = new URL('/auth/login', req.url);
          redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }
      } catch (authError) {
        // Only log errors that aren't cookie parsing errors we want to ignore
        if (!isCookieParsingError(authError)) {
          console.error('Authentication error in middleware:', authError);
        }
        
        // If auth fails on a protected route, redirect to login
        const redirectUrl = new URL('/auth/login', req.url);
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Add the required security headers
    res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    res.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

    return res;
  } catch (error) {
    // Only log errors that aren't cookie parsing errors we want to ignore
    if (!isCookieParsingError(error)) {
      console.error('Middleware general error:', error);
    }
    
    // For API routes, return an error response
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
    
    // For other routes, allow the request to proceed
    return NextResponse.next();
  }
}

// Update matcher to be more specific about which routes to handle
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};