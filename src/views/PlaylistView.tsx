import React, { useState } from 'react';
import { Play, Clock, MoreHorizontal, Music, Search, X, Edit2, Trash2, Share2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Playlist, Track } from '../types';

interface PlaylistViewProps {
  playlist: Playlist | null;
  playTrack: (t: Track, queue?: Track[]) => void;
  currentTrackId?: string;
  formatTime: (s: number) => string;
  onDeletePlaylist?: (id: string) => void;
  onRenamePlaylist?: (id: string, name: string) => void;
  onRemoveTrack?: (playlistId: string, trackId: string) => void;
  sortBy: 'title' | 'artist' | 'date';
  onSortChange: (sort: 'title' | 'artist' | 'date') => void;
}

export function PlaylistView({ 
  playlist, playTrack, currentTrackId, formatTime, 
  onDeletePlaylist, onRenamePlaylist, onRemoveTrack,
  sortBy, onSortChange
}: PlaylistViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [activeTrackMenu, setActiveTrackMenu] = useState<string | null>(null);
  
  if (!playlist) return null;

  const filteredTracks = [...playlist.tracks]
    .filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.album && t.album.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
      return 0;
    });

  return (
    <div className="flex flex-col gap-8 pb-10 px-4">
      {/* Header */}
      <div className="relative pt-12 pb-6">
        <div className="flex flex-col items-center text-center gap-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-48 h-48 md:w-64 md:h-64 rounded-[40px] shadow-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border)]"
          >
            {playlist.tracks[0] ? (
              <img 
                src={playlist.tracks[0].coverUrl} 
                className="w-full h-full object-cover" 
                alt="" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <Music size={80} style={{ color: 'var(--text-faint)' }} />
              </div>
            )}
          </motion.div>

          <div className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {playlist.name}
              </h1>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {playlist.tracks.length} titres • {playlist.description || "Ma collection"}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={() => filteredTracks[0] && playTrack(filteredTracks[0], filteredTracks)}
                className="btn-accent px-10 py-4 h-14 rounded-full font-black flex items-center gap-3"
              >
                <Play size={20} fill="white" />
                <span>Play All</span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-white border border-black/5 shadow-sm text-[var(--text-secondary)] hover:bg-gray-50 transition-all"
                >
                   <MoreHorizontal size={24} />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute top-16 left-1/2 -translate-x-1/2 w-56 bg-white border border-black/5 rounded-2xl shadow-2xl p-2 z-[100]"
                      onClick={e => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => {
                          const n = prompt('Nouveau nom :', playlist.name);
                          if (n) onRenamePlaylist?.(playlist.id, n);
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-semibold text-left transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <Edit2 size={18} /> Renommer
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Supprimer cette playlist ?')) onDeletePlaylist?.(playlist.id);
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 text-sm font-semibold text-left transition-colors"
                      >
                        <Trash2 size={18} /> Supprimer
                      </button>
                      <hr className="my-1 border-black/5" />
                      <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Trier</p>
                      {['title', 'artist', 'date'].map((s: any) => (
                        <button 
                          key={s}
                          onClick={() => { onSortChange(s); setShowMenu(false); }}
                          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-semibold text-left transition-colors ${sortBy === s ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search within playlist */}
      <div className="relative group max-w-sm mx-auto w-full">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
        <input 
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-full py-3 pl-12 pr-12 text-sm outline-none focus:border-[var(--accent)] shadow-sm transition-all"
          style={{ color: 'var(--text-primary)' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Track list */}
      <div className="space-y-2 mt-4">
        {filteredTracks.map((track, i) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => playTrack(track, filteredTracks)}
            className={`flex items-center gap-4 p-2 rounded-2xl cursor-pointer transition-all border ${currentTrackId === track.id ? 'bg-white border-[var(--accent)] shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-black/5 hover:shadow-sm'}`}
          >
            <div className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden shadow-sm">
              <img src={track.coverUrl} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <Play size={16} fill="white" color="white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold truncate ${currentTrackId === track.id ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                {track.title}
              </p>
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>
                {track.artist}
              </p>
            </div>

            <div className="flex items-center gap-4 pr-2">
              <span className="text-[10px] font-mono font-bold hidden sm:block" style={{ color: 'var(--text-faint)' }}>
                {track.duration > 0 ? formatTime(track.duration) : track.id.startsWith('local-') ? '...' : 'LIVE'}
              </span>
              
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTrackMenu(activeTrackMenu === track.id ? null : track.id);
                  }}
                  className="p-2 text-black/10 hover:text-[var(--text-secondary)] transition-colors"
                >
                  <MoreHorizontal size={20} />
                </button>

                <AnimatePresence>
                  {activeTrackMenu === track.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: -10 }}
                      className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-black/5 rounded-2xl shadow-2xl p-2 z-[110]"
                      onClick={e => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => {
                          onRemoveTrack?.(playlist.id, track.id);
                          setActiveTrackMenu(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 hover:bg-red-50 text-red-500 text-xs font-bold rounded-xl transition-colors"
                      >
                        <Trash2 size={16} /> Retirer
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredTracks.length === 0 && (
          <div className="py-20 text-center">
            <Music size={48} className="mx-auto mb-4" style={{ color: 'var(--text-faint)' }} />
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Playlist vide</p>
          </div>
        )}
      </div>
    </div>
  );
}
