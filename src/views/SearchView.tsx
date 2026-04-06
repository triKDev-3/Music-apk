import React, { useState } from 'react';
import { Search, Play, Heart, Plus, Check, Clock, Music, User, Disc } from 'lucide-react';
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
    <div className="py-6 space-y-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
            {isSearching
              ? 'Recherche en cours...'
              : searchResults.length > 0
              ? `Résultats pour "${searchQuery}"`
              : 'Rechercher de la musique'}
          </h2>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
            {searchResults.length} titres trouvés
          </p>
        </div>
      </div>

      {isSearching ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : isEmpty ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
            <Search size={40} className="text-white/20" />
          </div>
          <h3 className="text-xl font-bold mb-2">Aucun résultat trouvé</h3>
          <p className="text-sm text-white/40 max-w-xs">
            Essayez de rechercher par titre, artiste ou album. Vous pouvez aussi demander à l'IA une ambiance.
          </p>
        </motion.div>
      ) : (
        <div className="w-full">
          {/* Table Header */}
          <div className="grid grid-cols-[48px_1fr_1fr_1fr_120px] gap-4 px-4 py-3 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 sticky top-0 bg-black/80 backdrop-blur-md z-10">
            <div className="flex justify-center">#</div>
            <div>Titre</div>
            <div className="hidden md:block">Artiste</div>
            <div className="hidden lg:block">Album</div>
            <div className="flex justify-end pr-4"><Clock size={14} /></div>
          </div>

          <div className="mt-2 space-y-1">
            {searchResults.map((track, index) => {
              const isActive = currentTrack?.id === track.id;
              const isFav = favorites.includes(track.id);
              
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={clsx(
                    "grid grid-cols-[48px_1fr_1fr_1fr_120px] gap-4 px-4 py-3 rounded-xl transition-all group cursor-pointer relative",
                    isActive ? "bg-violet-500/10" : "hover:bg-white/5"
                  )}
                  onClick={() => playTrack(track, searchResults)}
                >
                  {/* Index / Play Icon */}
                  <div className="flex items-center justify-center relative">
                    <span className={clsx(
                      "text-xs font-medium transition-opacity group-hover:opacity-0",
                      isActive ? "text-violet-400" : "text-white/30"
                    )}>
                      {index + 1}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={16} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>

                  {/* Title & Cover */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded-md object-cover shadow-lg flex-shrink-0" />
                    <div className="min-w-0">
                      <p className={clsx(
                        "font-bold text-sm truncate",
                        isActive ? "text-violet-400" : "text-white"
                      )}>
                        {track.title}
                      </p>
                      <p className="text-[11px] text-white/40 truncate md:hidden">{track.artist}</p>
                    </div>
                    {track.source && (
                      <span className={clsx(
                        "text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-tighter flex-shrink-0",
                        track.source === 'spotify' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                      )}>
                        {track.source}
                      </span>
                    )}
                  </div>

                  {/* Artist */}
                  <div className="hidden md:flex items-center text-sm text-white/60 truncate">
                    {track.artist}
                  </div>

                  {/* Album */}
                  <div className="hidden lg:flex items-center text-sm text-white/40 truncate">
                    {track.album || '—'}
                  </div>

                  {/* Duration & Actions */}
                  <div className="flex items-center justify-end gap-4 pr-2">
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(track.id); }}
                      className={clsx(
                        "p-2 rounded-full transition-all hover:scale-110",
                        isFav ? "text-violet-500" : "text-white/20 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                    
                    <span className="text-xs font-mono text-white/30 w-10 text-right">
                      {track.duration > 0 ? formatTime(track.duration) : '-:--'}
                    </span>

                    <div className="relative">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === track.id ? null : track.id);
                        }}
                        className="p-2 rounded-full text-white/20 opacity-0 group-hover:opacity-100 hover:text-white transition-all"
                      >
                        <Plus size={18} />
                      </button>

                      <AnimatePresence>
                        {activeMenu === track.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl z-[100] p-2 border border-white/10 bg-[#121212] backdrop-blur-xl"
                            onClick={e => e.stopPropagation()}
                          >
                            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5 mb-2">
                              Ajouter à la playlist
                            </p>
                            <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
                              {playlists.filter(p => p.id !== 'local-playlist').map(p => {
                                const alreadyIn = p.tracks.some(t => t.id === track.id);
                                return (
                                  <button
                                    key={p.id}
                                    disabled={alreadyIn}
                                    onClick={() => { onAddToPlaylist(p.id, track); setActiveMenu(null); }}
                                    className="w-full text-left px-3 py-2.5 text-xs flex items-center justify-between hover:bg-white/5 rounded-xl transition-all group/item"
                                  >
                                    <span className={clsx("truncate font-medium", alreadyIn ? "text-white/20" : "text-white/70 group-hover/item:text-white")}>
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
