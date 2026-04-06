import React from 'react';
import { Play, Music } from 'lucide-react';
import { Track } from '../../types';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface TrackCardProps {
  track: Track;
  onPlay: () => void;
  isActive?: boolean;
}

export function TrackCard({ track, onPlay, isActive = false }: TrackCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onPlay}
      className={clsx(
        "group p-4 rounded-[32px] transition-all duration-500 cursor-pointer border relative overflow-hidden",
        isActive 
          ? "bg-violet-500/10 border-violet-500/30 shadow-[0_20px_50px_rgba(139,92,246,0.2)]" 
          : "bg-[#121212] border-white/5 hover:border-white/10 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
      )}
    >
      {/* Background Glow */}
      <div className={clsx(
        "absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[60px] transition-opacity duration-700",
        isActive ? "bg-violet-500/20 opacity-100" : "bg-white/5 opacity-0 group-hover:opacity-100"
      )} />

      <div className="relative aspect-square mb-4 rounded-2xl overflow-hidden shadow-2xl bg-white/5">
        <img 
          src={track.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop'} 
          alt={track.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            className="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.6)]"
          >
            <Play size={24} fill="white" className="text-white ml-1" />
          </motion.div>
        </div>

        {/* Playing Indicator */}
        {isActive && (
          <div className="absolute bottom-3 right-3 flex gap-1 items-end h-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
            <div className="w-1 h-2 bg-violet-400 rounded-full animate-[bar-grow_1s_infinite]" />
            <div className="w-1 h-3 bg-violet-400 rounded-full animate-[bar-grow_1.2s_infinite]" />
            <div className="w-1 h-1.5 bg-violet-400 rounded-full animate-[bar-grow_0.8s_infinite]" />
          </div>
        )}
      </div>

      <div className="space-y-1.5 relative z-10">
        <h4 className={clsx(
          "font-black text-sm tracking-tight leading-tight line-clamp-1 transition-colors",
          isActive ? "text-violet-400" : "text-white group-hover:text-violet-400"
        )}>
          {track.title}
        </h4>
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] truncate flex-1">
            {track.artist}
          </p>
          {track.source === 'spotify' && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
