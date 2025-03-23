import { redirect } from 'next/navigation';

export function handleChatRedirect() {
  // This function is used to handle redirects for the chat page
  // It ensures that the user is not redirected to the dashboard
  return false;
} 