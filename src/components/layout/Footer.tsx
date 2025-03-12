"use client";

import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-12 ml-64">
      <div className="max-w-5xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Mindfulness Chatbot</h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
              Your personal AI companion for mindfulness and mental wellbeing. Practice mindfulness anytime, anywhere.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-gray-600 hover:text-blue-600 transition-colors">
                  AI Chat
                </Link>
              </li>
              <li>
                <Link href="/exercises" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Exercises
                </Link>
              </li>
              <li>
                <Link href="/mood-tracker" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Mood Tracker
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 text-sm text-center">
            © {new Date().getFullYear()} Mindfulness Chatbot. All rights reserved.
            <span className="mx-2">•</span>
            Designed with <span className="text-red-500 mx-1">♥</span> for your mental wellbeing.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 