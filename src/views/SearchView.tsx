import React, { useState } from 'react';
import { Search, Play, Heart, Plus, Check } from 'lucide-react';
import { Track, Playlist } from '../types';
import { SkeletonRow } from '../components/ui/Skeleton';

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
    <div className="py-6 space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {isSearching
          ? 'Recherche en cours...'
          : searchResults.length > 0
          ? `Résultats pour "${searchQuery}"`
          : 'Rechercher de la musique'}
      </h2>

      {isSearching ? (
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24" style={{ color: 'var(--text-faint)' }}>
          <Search size={64} className="mb-4 opacity-30" />
          <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
            Recherchez vos musiques préférées
          </p>
          <p className="text-sm mt-1">Essayez un nom de chanson, d'artiste ou une ambiance</p>
        </div>
      ) : (
        <div className="space-y-1">
          {searchResults.map((track) => {
            const isActive = currentTrack?.id === track.id;
            const isFav = favorites.includes(track.id);
            return (
              <div
                key={track.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer group relative"
                style={{ background: isActive ? 'var(--bg-card)' : 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = isActive ? 'var(--bg-card)' : 'transparent';
                }}
                onClick={() => playTrack(track, searchResults)}
              >
                {/* Cover */}
                <div className="relative flex-shrink-0">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-12 h-12 rounded-lg object-cover shadow"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Play size={16} fill="white" className="text-white" />
                  </div>
                </div>

                {/* Text — stacked lines */}
                <div className="flex-1 min-w-0">
                  {/* Ligne 1: titre complet + badge source */}
                  <div className="flex items-start gap-2 flex-wrap">
                    <p
                      className="font-semibold text-sm leading-snug"
                      style={{ color: isActive ? '#10b981' : 'var(--text-primary)' }}
                    >
                      {track.title}
                    </p>
                    {track.source && (
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter flex-shrink-0 mt-0.5"
                        style={{
                          background: track.source === 'spotify' ? '#1db95420' : '#ff000020',
                          color: track.source === 'spotify' ? '#1db954' : '#ff4444',
                          border: `0.5px solid ${track.source === 'spotify' ? '#1db95430' : '#ff000030'}`
                        }}
                      >
                        {track.source}
                      </span>
                    )}
                  </div>
                  {/* Ligne 2: artiste */}
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {track.artist}
                  </p>
                  {/* Ligne 3: album · durée */}
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {track.album && (
                      <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                        {track.album}
                      </span>
                    )}
                    {/* Durée visible seulement sur mobile à côté de l'album */}
                    {track.duration > 0 && (
                      <span className="text-[11px] sm:hidden" style={{ color: 'var(--text-faint)' }}>
                        {track.album ? ' · ' : ''}{formatTime(track.duration)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Duration as a column (hidden on very small screens) */}
                <div className="hidden sm:flex items-center flex-shrink-0 mr-2 text-xs font-medium font-mono" style={{ color: 'var(--text-faint)' }}>
                  {track.duration > 0 ? formatTime(track.duration) : '-:--'}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); toggleFavorite(track.id); }}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    style={{ color: isFav ? '#10b981' : 'var(--text-faint)' }}
                  >
                    <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                  </button>

                  <div className="relative">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === track.id ? null : track.id);
                      }}
                      className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                      style={{ color: 'var(--text-faint)' }}
                    >
                      <Plus size={18} />
                    </button>

                    {activeMenu === track.id && (
                      <div
                        className="fixed md:absolute right-0 mt-2 w-48 rounded-lg shadow-2xl z-[100] p-1 border overflow-hidden"
                        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
                        onMouseLeave={() => setActiveMenu(null)}
                        onClick={e => e.stopPropagation()}
                      >
                        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5 mb-1">
                          Ajouter à la playlist
                        </p>
                        {playlists.filter(p => p.id !== 'local-playlist').map(p => {
                          const alreadyIn = p.tracks.some(t => t.id === track.id);
                          return (
                            <button
                              key={p.id}
                              disabled={alreadyIn}
                              onClick={() => { onAddToPlaylist(p.id, track); setActiveMenu(null); }}
                              className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/10 rounded transition-colors"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              <span className="truncate">{p.name}</span>
                              {alreadyIn && <Check size={12} className="text-emerald-500" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
