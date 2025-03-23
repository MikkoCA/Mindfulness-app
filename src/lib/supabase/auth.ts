import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Add email/password login to an OAuth account
export async function addPasswordToOAuthAccount(password: string) {
  try {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error adding password to OAuth account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Validate password strength
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true, message: 'Password is valid' };
} 