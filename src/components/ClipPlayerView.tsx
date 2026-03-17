import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, X, Maximize, Settings, Volume2, VolumeX, ChevronDown, ChevronLeft, Loader2, Tv } from 'lucide-react';
import { Track } from '../types';

interface ClipPlayerViewProps {
  track: Track | null;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  played: number;
  duration: number;
  onSeek: (val: number) => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
  onClose: () => void;
  onMinimize?: () => void;
  formatTime: (s: number) => string;
  volume: number;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  playbackRate: number;
  setPlaybackRate: (v: number) => void;
  isLoading?: boolean;
}

export function ClipPlayerView({
  track, isPlaying, setIsPlaying,
  played, duration, onSeek,
  onSkipNext, onSkipPrev, onClose, onMinimize,
  formatTime, volume, isMuted, setIsMuted,
  playbackRate, setPlaybackRate,
  isLoading = false
}: ClipPlayerViewProps) {
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isPlaying && !isHovering) {
      timer = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, isHovering]);

  if (!track) return null;

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden group"
      onMouseMove={() => setShowControls(true)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Background Dimmer */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between pointer-events-auto"
          >
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all">
              <ChevronLeft size={24} />
            </button>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-violet-500">Lecture Clip Vidéo</p>
              <h2 className="text-lg font-black truncate max-w-xs md:max-w-md">{track.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onMinimize} 
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-violet-400"
                title="Mini-lecteur (PIP)"
              >
                <Tv size={20} />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-full transition-all ${showSettings ? 'bg-violet-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  <Settings size={20} />
                </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 z-[100]"
                  >
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-tighter mb-2 px-2">Vitesse de lecture</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(v => (
                        <button
                          key={v}
                          onClick={() => { setPlaybackRate(v); setShowSettings(false); }}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${playbackRate === v ? 'bg-violet-600 text-white shadow-lg' : 'hover:bg-white/5 text-white/60'}`}
                        >
                          {v === 1 ? 'Normale' : `${v}x`}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Center Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center gap-8 md:gap-16 pointer-events-auto"
          >
            <button onClick={onSkipPrev} className="p-4 text-white/80 hover:text-white hover:scale-110 transition-all">
              <SkipBack size={32} fill="currentColor" />
            </button>
            
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-violet-600 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(143,0,255,0.4)] relative"
            >
              {isPlaying ? (
                <Pause size={40} fill="white" />
              ) : (
                <Play size={40} fill="white" className="ml-2" />
              )}
            </button>

            <button onClick={onSkipNext} className="p-4 text-white/80 hover:text-white hover:scale-110 transition-all">
              <SkipForward size={32} fill="currentColor" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Layout: Progress + Time + Meta */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-20 p-6 space-y-4 pointer-events-auto"
          >
            {/* Progress Bar */}
            <div className="flex flex-col gap-2">
              <input
                type="range"
                min={0}
                max={0.999999}
                step="any"
                value={played}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full accent-violet-500 bg-white/20 h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs font-mono text-white/60">
                <span>{duration > 0 ? formatTime(played * duration) : <span className="text-red-500 font-bold">LIVE</span>}</span>
                <span>{duration > 0 ? formatTime(duration) : <span className="text-red-500 font-bold">EN DIRECT</span>}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <button onClick={() => setIsMuted(!isMuted)} className="text-white/80 hover:text-white">
                   {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                 </button>
                 <div className="flex flex-col">
                   <p className="text-sm font-bold">{track.artist}</p>
                   {track.album && <p className="text-[10px] text-white/50">{track.album}</p>}
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 <button className="text-white/80 hover:text-white opacity-50">
                    <Maximize size={20} />
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Button - Toujours opérationnel pour sortir */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-[100] p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-md border border-white/10"
      >
        <X size={20} />
      </button>

      {/* Loading Overlay Global */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-violet-500 blur-2xl opacity-20 animate-pulse" />
              <Loader2 size={64} className="text-violet-500 animate-spin relative z-10" />
            </div>
            <p className="mt-4 text-violet-400 font-bold tracking-widest text-xs uppercase animate-pulse">Chargement...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
