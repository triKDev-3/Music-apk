import React from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle,
  Heart, Video, ListMusic, Volume2, Maximize2, Loader2,
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
      className="h-20 sm:h-24 px-2 sm:px-4 flex items-center justify-between z-30 shrink-0 w-full"
      style={{ background: 'var(--bg-player)', borderTop: '1px solid var(--border)' }}
    >
      {/* Track info - Cliquable pour plein écran */}
      <div 
        className="flex items-center gap-2 w-1/3 min-w-[200px] cursor-pointer group/bar hover:opacity-90 transition-opacity"
        onClick={onOpenNowPlaying}
      >
        {currentTrack ? (
          <>
            <div className="relative group flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 ml-1">
              {/* Le Disque/Album en rotation */}
              <div 
                className={`w-full h-full rounded-full border-[3px] border-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 ${isPlaying ? 'animate-spin' : ''}`}
                style={{ animationDuration: '8s', animationPlayState: isPlaying ? 'running' : 'paused' }}
              >
                {/* Centre du vinyl pour un effet plus réaliste */}
                <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-zinc-900 z-10 border-[1.5px] border-zinc-700 shadow-inner"></div>
                <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
              </div>
              {/* Overlay Vidéo ou Loading */}
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                 {isLoading && (
                   <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-[2px]">
                      <Loader2 size={24} className="text-violet-500 animate-spin" />
                   </div>
                 )}
              </div>
              
              <button
                onClick={(e) => { e.stopPropagation(); setIsClipMode(!isClipMode); }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-30 backdrop-blur-sm"
              >
                <Video size={18} style={{ color: isClipMode ? '#8F00FF' : 'white' }} />
              </button>
            </div>
            
            <div className="min-w-0 flex flex-col justify-center ml-2 mr-2 overflow-hidden">
              <div className="marquee-container">
                <p className="font-bold text-sm inline-block animate-marquee" style={{ color: 'var(--text-primary)' }}>
                  {currentTrack.title} &nbsp; • &nbsp; {currentTrack.title} &nbsp; • &nbsp; {currentTrack.title} &nbsp; • &nbsp;
                </p>
              </div>
              <div className="marquee-container">
                <p className="text-xs opacity-80 inline-block animate-marquee" style={{ color: 'var(--text-secondary)', animationDelay: '2s' }}>
                  {currentTrack.artist} &nbsp; • &nbsp; {currentTrack.artist} &nbsp; • &nbsp; {currentTrack.artist} &nbsp; • &nbsp;
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className="ml-auto sm:ml-2 transition-transform hover:scale-110 flex-shrink-0"
              style={{ color: isFav ? '#8F00FF' : 'var(--text-faint)' }}
            >
              <Heart size={20} fill={isFav ? 'currentColor' : 'none'} className={isFav ? 'drop-shadow-[0_0_8px_rgba(143,0,255,0.5)]' : ''} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4 ml-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] border-zinc-800/50 flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
               <ListMusic size={24} style={{ color: 'var(--text-faint)' }} className="opacity-50" />
            </div>
            <div className="space-y-2 hidden sm:block">
              <div className="w-24 h-4 rounded" style={{ background: 'var(--bg-card)' }} />
              <div className="w-16 h-3 rounded" style={{ background: 'var(--bg-card)' }} />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2 w-1/3 max-w-xl px-2">
        <div className="flex items-center gap-5 sm:gap-7">
          <Btn active={isShuffle} onClick={() => setIsShuffle(!isShuffle)}><Shuffle size={18} className="hidden sm:block" /></Btn>
          <Btn onClick={skipToPrev}><SkipBack size={22} fill="currentColor" className="hover:text-white" /></Btn>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0 shadow-md hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            style={{ background: 'var(--text-primary)' }}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--bg-base)' }} />
            ) : isPlaying ? (
              <Pause size={20} fill="var(--bg-base)" style={{ color: 'var(--bg-base)' }} />
            ) : (
              <Play size={20} fill="var(--bg-base)" style={{ color: 'var(--bg-base)', marginLeft: '4px' }} />
            )}
          </button>
          <Btn onClick={skipToNext}><SkipForward size={22} fill="currentColor" className="hover:text-white" /></Btn>
          <button 
            onClick={() => {
              const next: Record<string, 'off' | 'all' | 'one'> = { off: 'all', all: 'one', one: 'off' };
              setRepeatMode(next[repeatMode]);
            }}
            className={`transition-colors hidden sm:block ${repeatMode !== 'off' ? 'text-violet-500' : 'text-white/40 hover:text-white'}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] w-8 text-right" style={{ color: 'var(--text-faint)' }}>
            {formatTime(played * duration)}
          </span>
          <div className="flex-1 h-1 rounded-full relative group cursor-pointer" style={{ background: 'var(--bg-card)' }}>
            <input
              type="range" min={0} max={0.999999} step="any" value={played}
              onChange={e => handleSeekChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className="absolute top-0 left-0 h-full bg-white group-hover:bg-emerald-500 rounded-full transition-colors"
              style={{ width: `${played * 100}%`, background: 'var(--text-primary)' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${played * 100}%`, marginLeft: '-6px', background: 'var(--text-primary)' }}
            />
          </div>
          <span className="text-[10px] w-8" style={{ color: 'var(--text-faint)' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume & extras */}
      <div className="flex items-center justify-end gap-3 sm:gap-4 w-1/3 min-w-[120px]">
        <div className="hidden md:flex gap-4 items-center">
          <Btn active={isClipMode} onClick={() => setIsClipMode(!isClipMode)}><Video size={18} className="hover:text-white transition-colors" /></Btn>
          <Btn><ListMusic size={18} className="hover:text-white transition-colors" /></Btn>
        </div>
        <div className="flex items-center gap-2 group w-24 sm:w-28 md:w-32">
          <button onClick={() => setIsMuted(!isMuted)} style={{ color: 'var(--text-faint)' }} className="hover:text-white transition-colors">
            <Volume2 size={18} />
          </button>
          <div className="flex-1 h-1.5 rounded-full relative" style={{ background: 'var(--bg-card)' }}>
            <div
              className="absolute top-0 left-0 h-full rounded-full group-hover:bg-emerald-500 transition-colors"
              style={{ width: `${volume * 100}%`, background: 'var(--text-primary)' }}
            />
            <input
              type="range" min={0} max={1} step="any" value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        <Btn onClick={onOpenNowPlaying}><Maximize2 size={18} className="hidden sm:block hover:text-white transition-colors" /></Btn>
      </div>
    </footer>
  );
}
