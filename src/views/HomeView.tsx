import React from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Play, Search, Menu, Download } from 'lucide-react';
import { Track } from '../types';
import { INITIAL_TRACKS } from '../data/initialTracks';

interface HomeViewProps {
  currentTrack: Track | null;
  playTrack: (t: Track, queue?: Track[]) => void;
  handleMoodClick: (mood: string) => void;
  isMoodLoading: boolean;
  recentlyPlayed: Track[];
  liveTracks: Track[];
  recommendations?: Track[];
  isRecommendationsLoading?: boolean;
  onSearchOpen?: () => void;
  onMenuOpen?: () => void;
  onDownload?: (t: Track) => void;
}

/** Thin spinning spike visualizer around the vinyl disc */
function SpikeRing({ size = 200, isPlaying }: { size?: number; isPlaying: boolean }) {
  const spikes = 64;
  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.44;
  const outerR = size * 0.5;
  return (
    <svg width={size} height={size} className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {Array.from({ length: spikes }).map((_, i) => {
        const angle = (i / spikes) * Math.PI * 2;
        const r = innerR + (isPlaying ? Math.random() * (outerR - innerR) : 2);
        return (
          <line
            key={i}
            x1={cx + Math.cos(angle) * innerR}
            y1={cy + Math.sin(angle) * innerR}
            x2={cx + Math.cos(angle) * (innerR + (isPlaying ? 3 + Math.sin(i * 0.8) * 5 : 2))}
            y2={cy + Math.sin(angle) * (innerR + (isPlaying ? 3 + Math.sin(i * 0.8) * 5 : 2))}
            stroke="rgba(100,100,120,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

const POPULAR_TRACKS = INITIAL_TRACKS.slice(0, 3);
const NEW_RELEASES = INITIAL_TRACKS.slice(3, 8);

/**
 * HomeView component.
 * Displays new releases, popular tracks, recommendations, and recent activity.
 */
export const HomeView: React.FC<HomeViewProps> = ({
  currentTrack, playTrack, handleMoodClick,
  isMoodLoading, recentlyPlayed,
  recommendations = [], onDownload
}) => {
  const favorites = recentlyPlayed.slice(0, 4);
  const popular = recommendations.length > 0 ? recommendations.slice(0, 3) : POPULAR_TRACKS;
  const newReleases = recommendations.length > 3 ? recommendations.slice(3, 8) : NEW_RELEASES;

  return (
    <div className="pb-8 space-y-8 max-w-md mx-auto px-4 pt-4">

      {/* New Releases */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>New Releases</h2>
        </div>
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
          {newReleases.map((track, i) => (
            <motion.button
              key={track.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => playTrack(track, newReleases)}
              className="flex flex-col items-center gap-2 flex-shrink-0"
              style={{ width: 80 }}
            >
              <div
                className="relative rounded-full overflow-hidden border-4 border-white shadow-lg"
                style={{ width: 72, height: 72 }}
              >
                <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                {currentTrack?.id === track.id && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="flex gap-0.5 items-end h-4">
                      {[1,2,3].map(j => (
                        <div key={j} className="w-1 bg-white rounded-full animate-bar-grow" style={{ height: '60%', animationDelay: `${j*0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-center leading-tight" style={{ color: 'var(--text-primary)' }}>
                {track.title.length > 12 ? track.title.slice(0, 11) + '…' : track.title}
              </p>
              <p className="text-[10px] text-center" style={{ color: 'var(--text-secondary)' }}>
                {track.artist.length > 12 ? track.artist.slice(0, 11) + '…' : track.artist}
              </p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Popular */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Popular</h2>
          <button
            onClick={() => handleMoodClick('energy')}
            className="text-sm font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            More
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {popular.map((track, i) => (
            <motion.button
              key={track.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => playTrack(track, popular)}
              className="flex flex-col gap-2 text-left"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-square w-full shadow-md">
                <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                {/* Pink play button overlay bottom-right */}
                <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                  {track.youtubeId && onDownload && (
                     <div 
                        onClick={(e) => { e.stopPropagation(); onDownload(track); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors cursor-pointer"
                     >
                        <Download size={14} color="white" />
                     </div>
                  )}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Play size={14} fill="white" color="white" className="ml-0.5" />
                  </div>
                </div>
                {currentTrack?.id === track.id && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="flex gap-0.5 items-end h-5">
                      {[1,2,3].map(j => (
                        <div key={j} className="w-1 bg-white rounded-full animate-bar-grow" style={{ height: '50%', animationDelay: `${j*0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{track.title}</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>{track.artist}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Favorites / Recently Played */}
      {favorites.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Favorites</h2>
          </div>
          <div className="space-y-3">
            {favorites.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => playTrack(track, favorites)}
                className="flex items-center gap-3 cursor-pointer rounded-2xl px-1 py-1 transition-colors hover:bg-black/5"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: currentTrack?.id === track.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {track.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {track.artist}{track.album ? ` • ${track.album}` : ''}
                  </p>
                </div>
                <button className="p-1.5" style={{ color: 'var(--text-faint)' }}>
                  <MoreHorizontal size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Mood section fallback when no recently played */}
      {favorites.length === 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Explore by Mood</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'chill', name: 'Chill', bg: 'linear-gradient(135deg,#667eea,#764ba2)' },
              { id: 'energy', name: 'Energy', bg: 'linear-gradient(135deg,#f093fb,#f5576c)' },
              { id: 'focus', name: 'Focus', bg: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
              { id: 'workout', name: 'Sport', bg: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
              { id: 'happy', name: 'Happy', bg: 'linear-gradient(135deg,#fa709a,#fee140)' },
              { id: 'romance', name: 'Romance', bg: 'linear-gradient(135deg,#ff9a9e,#fad0c4)' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => handleMoodClick(m.id)}
                disabled={isMoodLoading}
                className="h-16 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-md active:scale-95 transition-transform"
                style={{ background: m.bg }}
              >
                {m.name}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
