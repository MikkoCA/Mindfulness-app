import SignupForm from '@/components/auth/SignupForm';

export const metadata = {
  title: 'Sign Up'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignupForm />
    </div>
  );
} 