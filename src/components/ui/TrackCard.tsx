import React from 'react';
import { Play } from 'lucide-react';
import { Track } from '../../types';

interface TrackCardProps {
  track: Track;
  onPlay: () => void;
  isActive?: boolean;
}

export function TrackCard({ track, onPlay, isActive = false }: TrackCardProps) {
  return (
    <div
      className={`group p-4 rounded-3xl transition-all duration-300 cursor-pointer border border-white/5 hover:border-violet-500/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative ${isActive ? 'bg-violet-500/10' : ''}`}
      style={{ background: isActive ? 'rgba(143, 0, 255, 0.1)' : 'var(--bg-card)' }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.background = 'var(--bg-card-hover)';
        e.currentTarget.style.transform = 'translateY(-8px)';
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.background = 'var(--bg-card)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onClick={onPlay}
    >
      <div className="relative aspect-square mb-4 rounded-2xl overflow-hidden shadow-2xl">
        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <button className="absolute inset-0 m-auto w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(143,0,255,0.6)] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all hover:scale-110">
          <Play size={24} fill="white" className="ml-1" />
        </button>
      </div>
      <div className="space-y-1">
        <h4
          className="font-black text-sm tracking-tight leading-snug line-clamp-2"
          style={{ color: isActive ? '#A78BFF' : 'var(--text-primary)' }}
        >
          {track.title}
        </h4>
        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest truncate mt-1">
          {track.artist}
        </p>
      </div>
      {isActive && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-violet-500 rounded-full animate-ping" />
      )}
    </div>
  );
}
