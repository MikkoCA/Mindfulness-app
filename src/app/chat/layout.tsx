import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat with AI',
  description: 'Chat with your mindfulness assistant',
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
} 