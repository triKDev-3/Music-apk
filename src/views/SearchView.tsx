import React, { useState } from 'react';
import { Search, Play, Heart, Clock, Plus, Check } from 'lucide-react';
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
    <div className="py-6 space-y-6">
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
          <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>Recherchez vos musiques préférées</p>
          <p className="text-sm mt-1">Essayez un nom de chanson, d'artiste ou une ambiance</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* En-tête du tableau */}
          <div
            className="grid gap-4 px-4 pb-3 text-xs font-bold uppercase tracking-widest"
            style={{
              gridTemplateColumns: '36px 1fr 1fr auto auto auto',
              color: 'var(--text-faint)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span className="text-right">#</span>
            <span>Titre</span>
            <span>Album</span>
            <Clock size={14} />
            <span />
            <span />
          </div>

          {searchResults.map((track, i) => {
            const isActive = currentTrack?.id === track.id;
            const isFav = favorites.includes(track.id);
            return (
              <div
                key={track.id}
                className="grid gap-4 px-4 py-2 rounded-md transition-colors cursor-pointer items-center group relative"
                style={{ gridTemplateColumns: '36px 1fr 1fr auto auto auto', background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  // On ne ferme pas le menu ici pour permettre le clic
                }}
                onClick={() => playTrack(track, searchResults)}
              >
                <span className="text-right text-sm group-hover:hidden" style={{ color: 'var(--text-faint)' }}>{i + 1}</span>
                <span className="text-right hidden group-hover:flex items-center justify-end" style={{ color: 'var(--text-primary)' }}>
                  <Play size={14} fill="currentColor" />
                </span>

                <div className="flex items-center gap-3 min-w-0">
                  <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover shadow flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: isActive ? '#10b981' : 'var(--text-primary)' }}>
                      {track.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{track.artist}</p>
                  </div>
                </div>

                <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{track.album || '-'}</p>
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{formatTime(track.duration)}</span>

                <button
                  onClick={e => { e.stopPropagation(); toggleFavorite(track.id); }}
                  className="transition-colors"
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
                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
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
            );
          })}
        </div>
      )}
    </div>
  );
}
