import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Music, Loader2 } from 'lucide-react';
import { Track } from '../types';
import { motion } from 'framer-motion';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean; setIsPlaying: (v: boolean) => void;
  isMuted: boolean; setIsMuted: (v: boolean) => void;
  volume: number; setVolume: (v: number) => void;
  played: number; duration: number;
  repeatMode: 'off' | 'all' | 'one'; setRepeatMode: (v: 'off' | 'all' | 'one') => void;
  isShuffle: boolean; setIsShuffle: (v: boolean) => void;
  isClipMode: boolean; setIsClipMode: (v: boolean) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  handleSeekChange: (val: number) => void;
  formatTime: (s: number) => string;
  skipToNext: () => void;
  skipToPrev: () => void;
  onOpenNowPlaying?: () => void;
  isLoading?: boolean;
}

/**
 * persistent playback controls (PlayerBar).
 * Displays current track info and provides playback actions.
 */
export function PlayerBar({
  currentTrack, isPlaying, setIsPlaying,
  played, duration,
  handleSeekChange, formatTime, skipToNext, skipToPrev,
  onOpenNowPlaying, isLoading,
}: PlayerBarProps) {
  const progress = duration > 0 ? played : 0;

  return (
    <footer
      className="relative flex-shrink-0"
      style={{
        background: 'var(--bg-player)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: 'var(--shadow-player)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Thin progress line at top */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-black/5">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progress * 100}%`, background: 'var(--accent)' }}
        />
      </div>

      <div
        className="flex items-center px-4 cursor-pointer"
        style={{ height: 80 }}
        onClick={onOpenNowPlaying}
      >
        {/* Vinyl / Album Art */}
        <div className="relative flex-shrink-0 mr-3" style={{ width: 52, height: 52 }}>
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear', paused: !isPlaying }}
            className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg"
            style={{
              animationPlayState: isPlaying ? 'running' : 'paused',
            }}
          >
            {currentTrack?.coverUrl ? (
              <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: '#F0F0F0' }}>
                <Music size={20} style={{ color: 'var(--text-faint)' }} />
              </div>
            )}
          </motion.div>
          {/* Center dot */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 10 }}
          >
            <div className="w-3 h-3 rounded-full bg-white border-2 shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
          </div>
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          {currentTrack ? (
            <>
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {currentTrack.title}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {currentTrack.artist}
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Aucune piste sélectionnée</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 ml-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={skipToPrev}
            className="transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <SkipBack size={22} fill="currentColor" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn-accent flex-shrink-0"
            style={{ width: 44, height: 44 }}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={20} fill="white" color="white" />
            ) : (
              <Play size={20} fill="white" color="white" className="ml-0.5" />
            )}
          </button>

          <button
            onClick={skipToNext}
            className="transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <SkipForward size={22} fill="currentColor" />
          </button>
        </div>
      </div>
    </footer>
  );
}
