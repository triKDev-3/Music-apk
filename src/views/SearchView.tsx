import React, { useState } from 'react';
import { Search, Play, Heart, Plus, Check, Clock, Music } from 'lucide-react';
import { Track, Playlist } from '../types';
import { SkeletonRow } from '../components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface SearchViewProps {
  searchResults: Track[];
  isSearching: boolean;
  searchQuery: string;
  currentTrack: Track | null;
  favorites: string[];
  playTrack: (t: Track, queue?: Track[]) => void;
  toggleFavorite: (id: string) => void;
  formatTime: (s: number) => string;
  playlists: Playlist[];
  onAddToPlaylist: (pId: string, t: Track) => void;
}

export function SearchView({
  searchResults, isSearching, searchQuery,
  currentTrack, favorites, playTrack, toggleFavorite, formatTime,
  playlists, onAddToPlaylist
}: SearchViewProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const isEmpty = !isSearching && searchResults.length === 0;

  return (
    <div className="py-6 space-y-8 px-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {isSearching
            ? 'Recherche...'
            : searchQuery
            ? `Résultats pour "${searchQuery}"`
            : 'Rechercher'}
        </h2>
        {searchResults.length > 0 && (
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {searchResults.length} titres trouvés
          </p>
        )}
      </div>

      {isSearching ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : isEmpty ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[var(--bg-card)] shadow-sm border border-[var(--border)] flex items-center justify-center mb-6">
            <Search size={32} style={{ color: 'var(--text-faint)' }} />
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Découvrir de nouveaux sons</h3>
          <p className="text-xs max-w-[240px]" style={{ color: 'var(--text-secondary)' }}>
            Recherchez vos artistes, titres ou albums préférés ci-dessus.
          </p>
        </motion.div>
      ) : (
        <div className="w-full">
          {/* List layout instead of heavy table */}
          <div className="space-y-2">
            {searchResults.map((track, index) => {
              const isActive = currentTrack?.id === track.id;
              const isFav = favorites.includes(track.id);
              
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={clsx(
                    "flex items-center gap-4 p-2 rounded-2xl transition-all group cursor-pointer border",
                    isActive 
                      ? "bg-white border-[var(--accent)] shadow-sm" 
                      : "bg-transparent border-transparent hover:bg-white hover:border-black/5 hover:shadow-sm"
                  )}
                  onClick={() => playTrack(track, searchResults)}
                >
                  <div className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play size={16} fill="white" color="white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      "font-bold text-sm truncate",
                      isActive ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                    )}>
                      {track.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {track.artist} {track.album ? `• ${track.album}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                      className={clsx(
                        "p-2 rounded-full hover:bg-[var(--bg-app)] transition-all",
                        isFav ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                      style={{ color: isFav ? 'var(--accent)' : 'var(--text-secondary)' }}
                    >
                      <Heart size={18} fill={isFav ? "var(--accent)" : "none"} />
                    </button>
                    
                    <span className="text-[10px] font-mono font-bold hidden sm:block" style={{ color: 'var(--text-faint)' }}>
                      {track.duration > 0 ? formatTime(track.duration) : '-:--'}
                    </span>

                    <div className="relative">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === track.id ? null : track.id);
                        }}
                        className="p-2 rounded-full text-black/10 hover:text-[var(--text-secondary)] transition-all"
                      >
                        <Plus size={20} />
                      </button>

                      <AnimatePresence>
                        {activeMenu === track.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 8 }}
                            className="absolute right-0 mt-2 w-52 rounded-2xl shadow-2xl z-[100] p-2 border border-black/5 bg-white backdrop-blur-xl"
                            onClick={e => e.stopPropagation()}
                          >
                            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b border-black/5 mb-1" style={{ color: 'var(--text-faint)' }}>
                              Ajouter à...
                            </p>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                              {playlists.filter(p => p.id !== 'local-playlist').map(p => {
                                const alreadyIn = p.tracks.some(t => t.id === track.id);
                                return (
                                  <button
                                    key={p.id}
                                    disabled={alreadyIn}
                                    onClick={() => { onAddToPlaylist(p.id, track); setActiveMenu(null); }}
                                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-black/5 rounded-xl transition-all"
                                  >
                                    <span className={clsx("truncate font-semibold", alreadyIn ? "text-black/20" : "text-[var(--text-primary)]")}>
                                      {p.name}
                                    </span>
                                    {alreadyIn && <Check size={14} className="text-emerald-500" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
