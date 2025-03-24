"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tracks = [
  {
    id: 1,
    name: 'Track 1',
    url: '/audio/track1.mp3',
    icon: '🎵'
  },
  {
    id: 2,
    name: 'Track 2',
    url: '/audio/track2.mp3',
    icon: '🎵'
  },
  {
    id: 3,
    name: 'Track 3',
    url: '/audio/track3.mp3',
    icon: '🎵'
  }
];

export default function AmbientPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(1);
  const [volume, setVolume] = useState(0.3);
  const [isExpanded, setIsExpanded] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio(tracks[currentTrack - 1].url);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentTrack]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const changeTrack = (trackId: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrack(trackId);
    setIsPlaying(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Minimized Player */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-3 ${
          isExpanded ? 'mb-2' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            {isExpanded ? '▼' : '▲'}
          </button>
          <span className="text-sm font-medium">{tracks[currentTrack - 1].name}</span>
          <button
            onClick={togglePlay}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>
      </motion.div>

      {/* Expanded Controls */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-4 overflow-hidden"
          >
            <div className="flex items-center gap-4">
              {/* Track Selection */}
              <div className="flex gap-2">
                {tracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => changeTrack(track.id)}
                    className={`p-2 rounded-lg transition-all ${
                      currentTrack === track.id
                        ? 'bg-teal-100 text-teal-600'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm font-medium">{track.name}</span>
                  </button>
                ))}
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <span className="text-xl">🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 