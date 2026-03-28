import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, X, Maximize, Settings, Volume2, VolumeX, ChevronDown, ChevronLeft, Loader2, Tv, AlertTriangle } from 'lucide-react';
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
  hasError?: boolean;
  brightness: number;
  saturation: number;
  onFiltersChange: (f: Partial<{ brightness: number, saturation: number }>) => void;
}

export function ClipPlayerView({
  track, isPlaying, setIsPlaying,
  played, duration, onSeek,
  onSkipNext, onSkipPrev, onClose, onMinimize,
  formatTime, volume, isMuted, setIsMuted,
  playbackRate, setPlaybackRate,
  isLoading = false,
  hasError = false,
  brightness, saturation, onFiltersChange
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
                    className="absolute top-full right-0 mt-2 w-56 bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl p-4 z-[200] space-y-4"
                  >
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-tighter mb-2">Vitesse</p>
                      <div className="grid grid-cols-3 gap-1">
                        {[0.5, 1, 1.5, 2].map(v => (
                          <button
                            key={v}
                            onClick={() => { setPlaybackRate(v); }}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${playbackRate === v ? 'bg-violet-600 text-white shadow-lg' : 'hover:bg-white/5 text-white/60'}`}
                          >
                            {v}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-tighter mb-2">Amélioration Vidéo</p>
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[8px] font-bold text-white/60 uppercase">
                            <span>Luminosité</span>
                            <span>{Math.round(brightness * 100)}%</span>
                          </div>
                          <input type="range" min="0.5" max="1.5" step="0.05" value={brightness} onChange={(e) => onFiltersChange({ brightness: parseFloat(e.target.value) })} className="w-full h-1 bg-white/10 rounded-full accent-violet-500" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[8px] font-bold text-white/60 uppercase">
                            <span>Saturation</span>
                            <span>{Math.round(saturation * 100)}%</span>
                          </div>
                          <input type="range" min="0" max="2" step="0.1" value={saturation} onChange={(e) => onFiltersChange({ saturation: parseFloat(e.target.value) })} className="w-full h-1 bg-white/10 rounded-full accent-emerald-500" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Video Fallback (Album Art) */}
      <AnimatePresence>
        {(!isPlaying || isLoading || !track.youtubeId) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl z-0" />
            <motion.img 
              src={track.coverUrl}
              alt={track.title}
              className="relative z-10 w-64 h-64 md:w-96 md:h-96 object-cover rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10"
              animate={{ 
                scale: isPlaying ? [1, 1.02, 1] : 1,
                rotate: isPlaying ? [0, 1, 0, -1, 0] : 0
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
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
            className="absolute inset-0 z-20 flex items-center justify-center gap-4 md:gap-12 pointer-events-auto"
          >
            <button onClick={onSkipPrev} className="p-2 text-white/60 hover:text-white transition-all hidden md:block">
              <SkipBack size={24} fill="currentColor" />
            </button>

            {/* Skip -10s */}
            <button 
              onClick={() => onSeek(Math.max(0, played - (10 / duration)))}
              className="group flex flex-col items-center justify-center w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-md transition-all active:scale-95"
              title="Reculer de 10s"
            >
              <div className="relative group-hover:scale-110 transition-transform">
                <SkipBack size={24} className="rotate-180 scale-x-[-1]" />
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black mt-0.5 opacity-80">-10</span>
              </div>
            </button>
            
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(255,255,255,0.2)] relative z-30"
            >
              {isPlaying ? (
                <Pause size={40} fill="black" />
              ) : (
                <Play size={40} fill="black" className="ml-2" />
              )}
            </button>

            {/* Skip +10s */}
            <button 
              onClick={() => onSeek(Math.min(0.9999, played + (10 / duration)))}
              className="group flex flex-col items-center justify-center w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-md transition-all active:scale-95"
              title="Avancer de 10s"
            >
              <div className="relative group-hover:scale-110 transition-transform">
                <SkipForward size={24} />
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black mt-0.5 opacity-80">+10</span>
              </div>
            </button>

            <button onClick={onSkipNext} className="p-2 text-white/60 hover:text-white transition-all hidden md:block">
              <SkipForward size={24} fill="currentColor" />
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

      {/* Loading & Error Overlay */}
      <AnimatePresence>
        {(isLoading || hasError) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-[80] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md ${hasError ? 'pointer-events-auto' : 'pointer-events-none'}`}
          >
            {hasError ? (
              <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded-3xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-red-500 blur-2xl opacity-20 animate-pulse" />
                  <AlertTriangle size={64} className="text-red-500 relative z-10" />
                </div>
                <h3 className="text-xl font-black text-white mb-2 tracking-tight">Lecture impossible</h3>
                <p className="text-sm text-red-200/60 text-center max-w-xs mb-6">
                  Le contenu ne peut pas être lu actuellement. Il s'agit peut-être d'une restriction régionale ou d'un blocage YouTube.
                </p>
                <button
                  onClick={onSkipNext}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2"
                >
                  <SkipForward size={18} />
                  Passer au suivant
                </button>
              </div>
            ) : (
              // Loading State
              <>
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-violet-500 blur-2xl opacity-20 animate-pulse" />
                  <Loader2 size={64} className="text-violet-500 animate-spin relative z-10" />
                </div>
                <p className="mt-4 text-violet-400 font-bold tracking-widest text-xs uppercase animate-pulse">Chargement...</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
