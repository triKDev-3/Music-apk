import { Play, Download } from 'lucide-react';
import { Track } from '../../types';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface TrackCardProps {
  track: Track;
  onPlay: () => void;
  onDownload?: (t: Track) => void;
  isActive?: boolean;
}

/**
 * TrackCard component.
 * Displays a track's cover, title, and artist, with a play button overlay.
 */
export function TrackCard({ track, onPlay, onDownload, isActive = false }: TrackCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.96 }}
      onClick={onPlay}
      className={clsx(
        "group p-3 rounded-[24px] transition-all duration-300 cursor-pointer border relative overflow-hidden",
        isActive 
          ? "bg-[var(--bg-card)] border-[var(--accent)] shadow-[0_12px_30px_rgba(255,64,103,0.1)]" 
          : "bg-[var(--bg-card)] border-transparent shadow-sm hover:shadow-md hover:border-[var(--border)]"
      )}
    >
      <div className="relative aspect-square mb-3 rounded-2xl overflow-hidden bg-[var(--bg-base)]">
        <img 
          src={track.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop'} 
          alt={track.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          referrerPolicy="no-referrer"
        />
        
        {/* Play & Download Actions */}
        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
          {track.youtubeId && onDownload && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDownload(track); }}
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors"
            >
              <Download size={18} color="white" />
            </button>
          )}
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: 'var(--accent)' }}
          >
            <Play size={18} fill="white" color="white" className="ml-0.5" />
          </div>
        </div>

        {/* Active Indicator Overlay */}
        {isActive && (
          <div className="absolute inset-0 bg-[var(--accent)]/10 flex items-center justify-center">
            <div className="flex gap-0.5 items-end h-5">
              <div className="w-1 bg-[var(--accent)] rounded-full animate-bar-grow" style={{ height: '60%', animationDelay: '0s' }} />
              <div className="w-1 bg-[var(--accent)] rounded-full animate-bar-grow" style={{ height: '100%', animationDelay: '0.15s' }} />
              <div className="w-1 bg-[var(--accent)] rounded-full animate-bar-grow" style={{ height: '40%', animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
      </div>

      <div className="px-1 space-y-0.5">
        <h4 className={clsx(
          "font-bold text-sm truncate transition-colors leading-tight",
          isActive ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
        )}>
          {track.title}
        </h4>
        <p className="text-[10px] font-semibold text-[var(--text-secondary)] truncate">
          {track.artist}
        </p>
      </div>
    </motion.div>
  );
}
