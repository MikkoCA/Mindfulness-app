import { redirect } from 'next/navigation';

export default function NotFound() {
  // This ensures that if the /chat route is not found, it redirects to the /chat page
  redirect('/chat');
} 