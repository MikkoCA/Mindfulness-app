'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AudioSettings {
  masterVolume: number;
  // Future settings like bellVolume, tickVolume can be added here
}

interface AudioSettingsContextType {
  settings: AudioSettings;
  updateSettings: (newSettings: Partial<AudioSettings>) => void;
}

const defaultSettings: AudioSettings = {
  masterVolume: 0.5, // Default to 50% volume
};

const AudioSettingsContext = createContext<AudioSettingsContextType | undefined>(undefined);

export const AudioSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('audioSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          return { ...defaultSettings, ...parsed };
        } catch (e) {
          console.error("Failed to parse audio settings from localStorage", e);
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioSettings', JSON.stringify(settings));
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AudioSettings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  };

  return (
    <AudioSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AudioSettingsContext.Provider>
  );
};

export const useAudioSettings = () => {
  const context = useContext(AudioSettingsContext);
  if (context === undefined) {
    throw new Error('useAudioSettings must be used within an AudioSettingsProvider');
  }
  return context;
}; 