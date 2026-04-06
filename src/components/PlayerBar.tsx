import React from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle,
  Heart, Video, ListMusic, Volume2, Maximize2, Loader2, Music
} from 'lucide-react';
import { Track } from '../types';

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

const Btn = ({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="transition-colors"
    style={{ color: active ? '#8F00FF' : 'var(--text-faint)' }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)'; }}
  >
    {children}
  </button>
);

export function PlayerBar({
  currentTrack, isPlaying, setIsPlaying,
  isMuted, setIsMuted, volume, setVolume,
  played, duration,
  repeatMode, setRepeatMode, isShuffle, setIsShuffle,
  isClipMode, setIsClipMode,
  favorites, toggleFavorite,
  handleSeekChange, formatTime, skipToNext, skipToPrev,
  onOpenNowPlaying, isLoading,
}: PlayerBarProps) {
  const isFav = currentTrack ? favorites.includes(currentTrack.id) : false;

  return (
    <footer
      className="h-20 sm:h-24 px-4 flex items-center justify-between z-30 shrink-0 w-full relative bg-black border-t border-white/5 backdrop-blur-xl"
    >
      {/* Mobile Progress Bar (Top edge) */}
      <div className="absolute top-0 left-0 w-full h-[1px] sm:hidden bg-zinc-800">
        <div 
          className="h-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" 
          style={{ width: `${duration > 0 ? (played / duration) * 100 : 0}%` }} 
        />
      </div>

      {/* Track info */}
      <div 
        className="flex items-center gap-4 sm:w-1/3 sm:min-w-[240px] flex-1 cursor-pointer group/bar overflow-hidden"
        onClick={onOpenNowPlaying}
      >
        {currentTrack ? (
          <>
            <div className="relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 shadow-2xl">
              <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover rounded-lg" />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center backdrop-blur-[2px]">
                  <Loader2 size={20} className="text-violet-500 animate-spin" />
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setIsClipMode(!isClipMode); }}
                className={`absolute -top-1 -right-1 p-1 rounded-full shadow-lg transition-all ${isClipMode ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'} hidden sm:flex`}
              >
                <Video size={12} />
              </button>
            </div>
            
            <div className="min-w-0 flex flex-col justify-center overflow-hidden flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm sm:text-base text-white truncate group-hover/bar:text-violet-400 transition-colors">
                  {currentTrack.title}
                </p>
                {isPlaying && (
                  <div className="flex gap-0.5 items-end h-3 mb-1">
                    <div className="w-0.5 h-full bg-violet-500 animate-[bar-grow_0.8s_infinite]" />
                    <div className="w-0.5 h-2/3 bg-violet-500 animate-[bar-grow_1.2s_infinite]" />
                    <div className="w-0.5 h-1/2 bg-violet-500 animate-[bar-grow_1s_infinite]" />
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate font-medium">
                {currentTrack.artist}
              </p>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(currentTrack.id); }}
              className={`ml-2 transition-all hover:scale-110 flex-shrink-0 hidden sm:block ${isFav ? 'text-violet-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Heart size={20} fill={isFav ? 'currentColor' : 'none'} className={isFav ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : ''} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-zinc-900 flex items-center justify-center border border-white/5">
               <Music size={24} className="text-zinc-700" />
            </div>
            <div className="space-y-2 hidden sm:block">
              <div className="w-32 h-4 bg-zinc-900 rounded animate-pulse" />
              <div className="w-20 h-3 bg-zinc-900 rounded animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Controls - Desktop */}
      <div className="hidden sm:flex flex-col items-center gap-3 w-1/3 max-w-xl px-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsShuffle(!isShuffle)}
            className={`transition-colors ${isShuffle ? 'text-violet-500' : 'text-zinc-500 hover:text-white'}`}
          >
            <Shuffle size={18} />
          </button>
          <button onClick={skipToPrev} className="text-zinc-300 hover:text-white transition-colors">
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-white/10"
          >
            {isLoading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" className="ml-1" />
            )}
          </button>
          <button onClick={skipToNext} className="text-zinc-300 hover:text-white transition-colors">
            <SkipForward size={24} fill="currentColor" />
          </button>
          <button 
            onClick={() => {
              const next: Record<string, 'off' | 'all' | 'one'> = { off: 'all', all: 'one', one: 'off' };
              setRepeatMode(next[repeatMode]);
            }}
            className={`transition-colors ${repeatMode !== 'off' ? 'text-violet-500' : 'text-zinc-500 hover:text-white'}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 w-full group">
          <span className="text-[10px] w-10 text-right text-zinc-500 font-medium">
            {formatTime(played * duration)}
          </span>
          <div className="flex-1 h-1 bg-zinc-800 rounded-full relative cursor-pointer">
            <input
              type="range" min={0} max={0.999999} step="any" value={played}
              onChange={e => handleSeekChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className="absolute top-0 left-0 h-full bg-white group-hover:bg-violet-500 rounded-full transition-colors"
              style={{ width: `${played * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
              style={{ left: `${played * 100}%`, marginLeft: '-6px' }}
            />
          </div>
          <span className="text-[10px] w-10 text-zinc-500 font-medium">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Controls - Mobile */}
      <div className="flex sm:hidden items-center gap-4 pr-2">
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(currentTrack?.id || ''); }}
          className={`transition-transform hover:scale-110 ${isFav ? 'text-violet-500' : 'text-zinc-500'}`}
        >
          <Heart size={24} fill={isFav ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
          className="w-12 h-12 flex items-center justify-center text-white"
        >
          {isLoading ? (
            <Loader2 size={28} className="animate-spin text-violet-500" />
          ) : isPlaying ? (
            <Pause size={32} fill="currentColor" />
          ) : (
            <Play size={32} fill="currentColor" />
          )}
        </button>
      </div>

      {/* Volume & extras - Desktop */}
      <div className="hidden sm:flex items-center justify-end gap-6 sm:w-1/3 min-w-[200px]">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsClipMode(!isClipMode)} className={`transition-colors ${isClipMode ? 'text-violet-500' : 'text-zinc-500 hover:text-white'}`}>
            <Video size={20} />
          </button>
          <button className="text-zinc-500 hover:text-white transition-colors">
            <ListMusic size={20} />
          </button>
        </div>
        <div className="flex items-center gap-3 group w-32">
          <button onClick={() => setIsMuted(!isMuted)} className="text-zinc-500 hover:text-white transition-colors">
            <Volume2 size={20} />
          </button>
          <div className="flex-1 h-1 bg-zinc-800 rounded-full relative cursor-pointer">
            <div
              className="absolute top-0 left-0 h-full bg-zinc-400 group-hover:bg-violet-500 rounded-full transition-colors"
              style={{ width: `${volume * 100}%` }}
            />
            <input
              type="range" min={0} max={1} step="any" value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        <button onClick={onOpenNowPlaying} className="text-zinc-500 hover:text-white transition-colors">
          <Maximize2 size={20} />
        </button>
      </div>
    </footer>
  );
}
