'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginUser, getCurrentUser } from '@/lib/auth0';

// Add proper types for errors
interface AuthError {
  message: string;
  code?: string;
}

interface LoginError {
  message: string;
  code?: string;
  status?: number;
  name?: string;
}

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{email?: string; password?: string}>({});
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        // User is already logged in, redirect to home
        router.push('/');
      }
    };
    
    checkAuth();
    
    // Check if user was redirected from signup
    const fromSignup = searchParams.get('signup');
    if (fromSignup === 'success') {
      setSuccessMessage('Account created successfully! Please log in.');
    }
  }, [router, searchParams]);

  const validateForm = (): boolean => {
    const errors: {email?: string; password?: string} = {};
    let isValid = true;

    // Reset errors
    setFieldErrors({});
    setError(null);

    // Email validation
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setError(null);
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // Call the loginUser function from our auth service
      await loginUser(email, password);
      
      // Redirect to home after successful login
      router.push('/');
    } catch (err: unknown) {
      const error = err as LoginError;
      // Handle specific error messages from the auth service
      if (error.message === 'Invalid credentials') {
        setError({ message: 'Invalid email or password. Please try again.' });
      } else if (error.message === 'User not found') {
        setError({ message: 'No account found with this email. Please sign up first.' });
      } else if (error.message.includes('network')) {
        setError({ message: 'Network error. Please check your connection and try again.' });
      } else {
        setError({ message: 'Failed to log in. Please try again later.' });
      }
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Log In</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error.message}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900`}
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900`}
            placeholder="••••••••"
          />
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          
          <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-blue-600 text-white py-2 rounded-md font-medium ${
            isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      
      <p className="mt-8 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginForm; 