import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('Signout process started', {
      timestamp: new Date().toISOString()
    });
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current session before signing out (for logging)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session before signout:', {
        errorMessage: sessionError.message,
        errorCode: sessionError.status,
        errorName: sessionError.name,
        timestamp: new Date().toISOString()
      });
    }
    
    const userId = session?.user?.id;
    
    // Sign out the user
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error during signout:', {
        errorMessage: error.message,
        errorCode: error.status,
        errorName: error.name,
        userId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('User signed out successfully', {
        userId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Redirect to home page
    const redirectUrl = new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
    console.log('Redirecting after signout', {
      redirectUrl: redirectUrl.toString(),
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Unexpected error during signout:', {
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Redirect to home page even if there's an error
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  }
} 