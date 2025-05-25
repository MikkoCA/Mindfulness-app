'use client';

import React from 'react';
import { useAudioSettings } from '@/contexts/AudioSettingsContext';
import AuthGuard from '@/components/auth/AuthGuard';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { settings, updateSettings } = useAudioSettings();
  const supabase = createClient();
  const router = useRouter();

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ masterVolume: parseFloat(event.target.value) });
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      router.push('/');
    }
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 mb-8">
            Settings
          </h1>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Audio Settings</h2>
            <div className="mb-4">
              <label htmlFor="masterVolume" className="block text-sm font-medium text-gray-600 mb-1">
                Master Volume: {Math.round(settings.masterVolume * 100)}%
              </label>
              <input
                type="range"
                id="masterVolume"
                min="0"
                max="1"
                step="0.01"
                value={settings.masterVolume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-[rgb(220,247,241)] rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Account</h2>
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 rounded-xl font-medium bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </AuthGuard>
  );
} 