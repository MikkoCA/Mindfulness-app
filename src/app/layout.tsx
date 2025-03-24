import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import { AuthProvider } from '@/contexts/AuthContext';
// Import error handler to suppress cookie parsing errors
import '@/lib/supabase/errorHandler';
import { Inter } from 'next/font/google';
import AmbientPlayer from '@/components/audio/AmbientPlayer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Mindfulness Chatbot",
  description: "A chatbot for mindfulness exercises and mental wellbeing",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover"
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased ${inter.className}`}>
        <AuthProvider>
          <Header />
          <main className="pt-16">
            {children}
          </main>
          <AmbientPlayer />
        </AuthProvider>
      </body>
    </html>
  );
}
