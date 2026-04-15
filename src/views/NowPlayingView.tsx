import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SkipBack, SkipForward, Play, Pause,
  Repeat, Repeat1, Shuffle, Heart, ListMusic,
  MoreHorizontal, ChevronDown, Music2, X, Plus, ChevronLeft, ChevronRight,
  Gauge, Timer, Share2, Loader2, Download
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { Dialog } from '../components/ui/Dialog';

interface NowPlayingViewProps {
  track: Track | null;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  played: number;
  duration: number;
  repeatMode: 'off' | 'all' | 'one';
  setRepeatMode: (v: 'off' | 'all' | 'one') => void;
  isShuffle: boolean;
  setIsShuffle: (v: boolean) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  handleSeekChange: (val: number) => void;
  formatTime: (s: number) => string;
  skipToNext: () => void;
  skipToPrev: () => void;
  onClose: () => void;
  isClipMode: boolean;
  setIsClipMode: (v: boolean) => void;
  playlists: Playlist[];
  onAddToPlaylist: (pId: string, t: Track) => void;
  playbackRate: number;
  setPlaybackRate: (r: number) => void;
  sleepTimer: number | null;
  setSleepTimer: (s: number | null) => void;
  activeQueue: Track[];
  playTrack: (t: Track, q?: Track[]) => void;
  onMinimize?: () => void;
  isLoading?: boolean;
  hasError?: boolean;
  onDownload?: (t: Track) => void;
}

/**
 * Colorful vinyl disc with spike ring visualizer.
 * Matches the premium design mockup.
 */
function VinylDisc({ coverUrl, isPlaying, size = 280 }: { coverUrl: string; isPlaying: boolean; size?: number }) {
  const cx = size / 2;
  const innerRadius = size * 0.38;
  const spikeStart = size * 0.41;
  const spikeRange = size * 0.09;
  const spikes = 80;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Colorful gradient disc */}
      <motion.div
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full overflow-hidden shadow-2xl"
        style={{
          background: 'conic-gradient(from 0deg, #FF6B35, #E63946, #9B2335, #1D3557, #457B9D, #6B4C9A, #FF6B35)',
        }}
      >
        {/* Radial stripes overlay */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              repeating-conic-gradient(
                rgba(255,255,255,0.05) 0deg 2deg,
                transparent 2deg 5deg
              )
            `,
          }}
        />
        {/* Center white circle */}
        <div
          className="absolute bg-white rounded-full shadow-inner"
          style={{
            width: size * 0.13,
            height: size * 0.13,
            top: cx - size * 0.065,
            left: cx - size * 0.065,
            zIndex: 10,
          }}
        />
      </motion.div>

      {/* Spike visualizer SVG */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 5 }}
      >
        {Array.from({ length: spikes }).map((_, i) => {
          const angle = (i / spikes) * Math.PI * 2 - Math.PI / 2;
          const spikeLength = isPlaying
            ? spikeRange * (0.2 + 0.8 * Math.abs(Math.sin(i * 0.37 + Date.now() * 0.001)))
            : spikeRange * 0.3;
          const x1 = cx + Math.cos(angle) * spikeStart;
          const y1 = cx + Math.sin(angle) * spikeStart;
          const x2 = cx + Math.cos(angle) * (spikeStart + spikeLength);
          const y2 = cx + Math.sin(angle) * (spikeStart + spikeLength);
          return (
            <line
              key={i}
              x1={x1} y1={y1}
              x2={x2} y2={y2}
              stroke="rgba(80,80,100,0.5)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}

/** Waveform-style progress bar using many thin bars */
function WaveformProgress({ played, onChange }: { played: number; onChange: (v: number) => void }) {
  const bars = 50;
  return (
    <div className="relative w-full" style={{ height: 48 }}>
      {/* Bars */}
      <div className="flex items-center gap-[2px] w-full h-full">
        {Array.from({ length: bars }).map((_, i) => {
          const frac = i / bars;
          const active = frac <= played;
          const h = 8 + Math.abs(Math.sin(i * 0.45)) * 28;
          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-colors"
              style={{
                height: h,
                background: active ? 'var(--accent)' : 'rgba(0,0,0,0.1)',
              }}
            />
          );
        })}
      </div>
      {/* Invisible range input on top */}
      <input
        type="range"
        min={0} max={0.999999} step="any"
        value={played}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ zIndex: 10 }}
      />
    </div>
  );
}

export function NowPlayingView({
  track, isPlaying, setIsPlaying, played, duration,
  repeatMode, setRepeatMode, isShuffle, setIsShuffle,
  favorites, toggleFavorite, handleSeekChange, formatTime,
  skipToNext, skipToPrev, onClose,
  playlists, onAddToPlaylist,
  playbackRate, setPlaybackRate,
  sleepTimer, setSleepTimer,
  activeQueue, playTrack, onMinimize,
  isLoading = false, onDownload,
}: NowPlayingViewProps) {
  const [showQueue, setShowQueue] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [dialog, setDialog] = useState<{ isOpen: boolean; title: string; message: string; type?: any }>({ isOpen: false, title: '', message: '' });
  const isFav = track ? favorites.includes(track.id) : false;

  if (!track) return null;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed inset-0 z-[160] flex flex-col select-none overflow-hidden"
      style={{ background: '#FAFAFA' }}
    >
      {/* Soft ambient background glow from cover color */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 120% 60% at 50% 100%, rgba(255,64,103,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-6 pt-12 pb-4">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-black/5 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronDown size={28} />
        </button>

        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            Now Playing
          </p>
          <p className="text-[10px] font-semibold text-[var(--text-secondary)] truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>
            {track.album || 'Play Me'}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 rounded-full hover:bg-[var(--hover)] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <MoreHorizontal size={24} />
          </button>

          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                className="absolute top-12 right-0 w-64 rounded-2xl shadow-2xl p-2 z-[200]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                onClick={e => e.stopPropagation()}
              >
                {!showPlaylistPicker ? (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => { setShowPlaylistPicker(true); }}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-[var(--hover)] text-sm font-semibold text-left transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <div className="flex items-center gap-3"><Plus size={18} /> Ajouter à une playlist</div>
                      <ChevronRight size={16} style={{ color: 'var(--text-faint)' }} />
                    </button>
                    <button
                      onClick={() => { toggleFavorite(track.id); setShowMoreMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[var(--hover)] text-sm font-semibold text-left transition-colors"
                      style={{ color: isFav ? 'var(--accent)' : 'var(--text-primary)' }}
                    >
                      <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
                      {isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    </button>
                    {track.youtubeId && (
                      <button
                        onClick={async () => {
                          setShowMoreMenu(false);
                          if (onDownload) onDownload(track);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[var(--hover)] text-sm font-semibold text-left transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <Download size={18} />
                        Télécharger (Hors connexion)
                      </button>
                    )}
                    <hr style={{ borderColor: 'var(--border)' }} />
                    <button
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-[var(--hover)] text-sm font-semibold text-left"
                      style={{ color: 'var(--text-primary)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3"><Gauge size={18} /> Vitesse</div>
                      <div className="flex gap-1">
                        {[0.75, 1, 1.25, 1.5, 2].map(v => (
                          <div
                            key={v}
                            onClick={() => setPlaybackRate(v)}
                            className="px-1.5 py-0.5 rounded text-[10px] cursor-pointer font-bold"
                            style={{
                              background: playbackRate === v ? 'var(--accent)' : 'var(--bg-app)',
                              color: playbackRate === v ? 'white' : 'var(--text-secondary)',
                            }}
                          >
                            {v}x
                          </div>
                        ))}
                      </div>
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => setShowPlaylistPicker(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg mb-1 hover:bg-[var(--hover)]"
                      style={{ color: 'var(--accent)' }}
                    >
                      <ChevronLeft size={14} /> Retour
                    </button>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar px-1">
                      {playlists.filter(p => p.id !== 'local-playlist').map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            onAddToPlaylist(p.id, track);
                            setDialog({ isOpen: true, title: 'Succès', message: `Ajouté à "${p.name}"`, type: 'success' });
                            setShowMoreMenu(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[var(--hover)] text-sm font-semibold text-left"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-app)' }}>
                            <Music2 size={14} style={{ color: 'var(--text-secondary)' }} />
                          </div>
                          <span className="truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 overflow-y-auto no-scrollbar">
        {/* Vinyl disc */}
        <motion.div
          key={track.youtubeId}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative flex items-center justify-center"
        >
          <VinylDisc coverUrl={track.coverUrl} isPlaying={isPlaying} size={260} />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[var(--bg-app)]/40 backdrop-blur-sm">
              <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          )}
        </motion.div>

        {/* Title & Artist */}
        <div className="text-center w-full">
          <motion.h1
            key={track.title}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-black leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {track.title}
          </motion.h1>
          <motion.p
            key={track.artist}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-base mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {track.artist}
          </motion.p>
        </div>

        {/* Action icons row */}
        <div className="flex items-center justify-between w-full max-w-xs">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className="p-2 transition-colors"
            style={{ color: isShuffle ? 'var(--accent)' : 'var(--text-faint)' }}
          >
            <Shuffle size={22} />
          </button>
          <button
            onClick={() => { const next: any = { off: 'all', all: 'one', one: 'off' }; setRepeatMode(next[repeatMode]); }}
            className="p-2 transition-colors"
            style={{ color: repeatMode !== 'off' ? 'var(--accent)' : 'var(--text-faint)' }}
          >
            {repeatMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
          </button>
          <button
            onClick={() => toggleFavorite(track.id)}
            className="p-2 transition-colors"
            style={{ color: isFav ? 'var(--accent)' : 'var(--text-faint)' }}
          >
            <Heart size={22} fill={isFav ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="p-2 transition-colors"
            style={{ color: showQueue ? 'var(--accent)' : 'var(--text-faint)' }}
          >
            <ListMusic size={22} />
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-12 space-y-5 flex-shrink-0">
        {/* Waveform progress */}
        <WaveformProgress played={played} onChange={handleSeekChange} />

        {/* Timestamps */}
        <div className="flex justify-between text-xs font-semibold -mt-3" style={{ color: 'var(--text-secondary)' }}>
          <span>{formatTime(played * duration)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={skipToPrev}
            className="p-3 transition-opacity hover:text-[var(--accent)]"
            style={{ color: 'var(--text-primary)' }}
          >
            <SkipBack size={32} fill="currentColor" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn-accent"
            style={{ width: 64, height: 64 }}
          >
            {isLoading ? (
              <Loader2 size={28} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={28} fill="white" color="white" />
            ) : (
              <Play size={28} fill="white" color="white" className="ml-1" />
            )}
          </button>

          <button
            onClick={skipToNext}
            className="p-3 transition-opacity hover:text-[var(--accent)]"
            style={{ color: 'var(--text-primary)' }}
          >
            <SkipForward size={32} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Queue Side Panel */}
      <AnimatePresence>
        {showQueue && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute top-0 right-0 bottom-0 w-full sm:w-80 z-[180] flex flex-col shadow-2xl"
            style={{ background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between px-6 pt-12 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>File d'attente</h3>
              <button onClick={() => setShowQueue(false)} className="p-2 rounded-full hover:bg-[var(--hover)]">
                <X size={22} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
              {activeQueue.map((t, i) => (
                <div
                  key={t.id + i}
                  onClick={() => playTrack(t, activeQueue)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-[var(--hover)]"
                  style={{ background: t.id === track.id ? 'var(--bg-app)' : 'transparent' }}
                >
                  <img src={t.coverUrl} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold"
                      style={{ color: t.id === track.id ? 'var(--accent)' : 'var(--text-primary)' }}
                    >{t.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{t.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog(d => ({ ...d, isOpen: false }))}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />
    </motion.div>
  );
}
