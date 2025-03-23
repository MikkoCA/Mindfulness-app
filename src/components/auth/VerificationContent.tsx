'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerificationContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <div className="max-w-md w-full space-y-8 text-center">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Check your email
        </h2>
        <div className="mt-8 bg-white p-8 rounded-lg shadow">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-700 mb-4">
            We've sent a verification link to <span className="font-medium">{email}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Click the link in the email to verify your account and complete the signup process.
          </p>
          <div className="mt-6">
            <Link 
              href="/auth/login" 
              className="text-teal-600 hover:text-teal-500 font-medium"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 