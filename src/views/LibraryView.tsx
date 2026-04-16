import React, { useRef } from 'react';
import { Music, Play, Upload, Disc, User, Clock, Heart } from 'lucide-react';
import { Playlist, Track } from '../types';
import { motion } from 'framer-motion';

interface LibraryViewProps {
  favorites: string[];
  playlists: Playlist[];
  youtubePlaylists?: any[];
  stats: { totalTime: number; playCount: Record<string, number>; recentlyPlayed: string[] };
  onImportFiles: (files: FileList | File[]) => void;
  localTracks: Track[];
  playTrack: (t: Track, queue?: Track[]) => void;
  onPlaylistClick: (id: string, source?: string) => void;
  formatTime: (s: number) => string;
  sortBy: 'title' | 'artist' | 'date';
  onSortChange: (sort: 'title' | 'artist' | 'date') => void;
}

/**
 * LibraryView component.
 * Manages favorites, custom playlists, and local track imports.
 */
export function LibraryView({ 
  favorites, playlists, youtubePlaylists = [], stats, onImportFiles, 
  localTracks, playTrack, onPlaylistClick, formatTime,
  sortBy, onSortChange
}: LibraryViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalPlays = Object.values(stats.playCount).reduce((a, b) => a + b, 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onImportFiles(e.target.files);
  };

  const filteredLocalTracks = [...localTracks].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    return 0;
  });

  return (
    <div className="py-6 space-y-10 px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Bibliothèque</h2>
        <div className="flex gap-2">
          <select 
            value={sortBy} 
            onChange={(e) => onSortChange(e.target.value as any)}
            className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-bold rounded-full px-4 outline-none shadow-sm cursor-pointer"
          >
            <option value="date">Date</option>
            <option value="title">Titre</option>
            <option value="artist">Artiste</option>
          </select>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] font-bold text-sm shadow-sm hover:translate-y-[-2px] transition-transform"
          >
            <Upload size={18} />
            Importer
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept="audio/*"
            className="hidden" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {/* Liked Songs Special Card */}
          <motion.div 
            whileHover={{ y: -4 }}
            onClick={() => onPlaylistClick('p1')}
            className="group p-3 rounded-[32px] transition-all cursor-pointer bg-[var(--bg-card)] shadow-sm border border-transparent hover:border-[var(--border)] hover:shadow-md"
          >
            <div className="relative aspect-square mb-3 rounded-[24px] bg-gradient-to-br from-[#FF4067] to-[#FF8095] flex flex-col items-center justify-center overflow-hidden shadow-lg shadow-[#FF4067]/20">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_60%_40%,white,transparent)]" />
              <Heart size={32} fill="white" color="white" className="relative z-10" />
              <button className="absolute bottom-2 right-2 w-8 h-8 bg-white text-[var(--accent)] rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Play size={14} fill="currentColor" className="ml-0.5" />
              </button>
            </div>
            <div className="px-1">
              <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>Titres Likés</h4>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>{favorites.length} titres</p>
            </div>
          </motion.div>

          {playlists.map(playlist => (
            <motion.div 
              key={playlist.id} 
              whileHover={{ y: -4 }}
              onClick={() => onPlaylistClick(playlist.id)}
              className="group p-3 rounded-[32px] transition-all cursor-pointer bg-[var(--bg-card)] shadow-sm border border-transparent hover:border-[var(--border)] hover:shadow-md" 
            >
              <div className="relative aspect-square mb-3 rounded-[24px] flex items-center justify-center overflow-hidden bg-gray-50">
                {playlist.tracks.length > 0 ? (
                  <img src={playlist.tracks[0].coverUrl} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <Music size={32} style={{ color: 'var(--text-faint)' }} />
                )}
                <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: 'var(--accent)' }}>
                  <Play size={18} fill="white" color="white" className="ml-0.5" />
                </button>
              </div>
              <div className="px-1">
                <h4 className="font-bold truncate text-sm leading-tight text-[var(--text-primary)]">{playlist.name}</h4>
                <p className="text-[10px] font-semibold text-[var(--text-secondary)]">{playlist.tracks.length} titres</p>
              </div>
            </motion.div>
          ))}
      </div>

      {localTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Local</h3>
          </div>
          <div className="space-y-2">
            {filteredLocalTracks.map(track => (
              <div 
                key={track.id} 
                className="flex items-center gap-4 p-2 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-black/5 group cursor-pointer" 
                onClick={() => playTrack(track, filteredLocalTracks)}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Music size={18} style={{ color: 'var(--text-faint)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate group-hover:text-[var(--accent)] transition-colors">{track.title}</p>
                  <p className="text-xs truncate font-semibold" style={{ color: 'var(--text-secondary)' }}>{track.artist}</p>
                </div>
                <span className="text-[10px] font-mono font-bold px-3" style={{ color: 'var(--text-faint)' }}>
                  {track.duration > 0 ? formatTime(track.duration) : 'Locale'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-[var(--bg-card)] rounded-[32px] p-8 border border-[var(--border)] shadow-sm">
        <h3 className="text-xl font-black mb-6 tracking-tight" style={{ color: 'var(--text-primary)' }}>Stats</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Auditions</p>
            <p className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{totalPlays}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Playlists</p>
            <p className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{playlists.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Likes</p>
            <p className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{favorites.length}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
