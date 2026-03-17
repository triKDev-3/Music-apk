import React, { useRef } from 'react';
import { Music, Play, Upload, Disc, User, Clock, Calendar, Heart } from 'lucide-react';
import { Playlist, Track } from '../types';

interface LibraryViewProps {
  favorites: string[];
  playlists: Playlist[];
  stats: { totalTime: number; playCount: Record<string, number>; recentlyPlayed: string[] };
  onImportFiles: (files: FileList | File[]) => void;
  localTracks: Track[];
  playTrack: (t: Track, queue?: Track[]) => void;
  onPlaylistClick: (id: string) => void;
  formatTime: (s: number) => string;
  sortBy: 'title' | 'artist' | 'date';
  onSortChange: (sort: 'title' | 'artist' | 'date') => void;
}

export function LibraryView({ 
  favorites, playlists, stats, onImportFiles, 
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
    return 0; // Date par défaut
  });

  return (
    <div className="py-6 space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Votre Bibliothèque</h2>
        <div className="flex gap-2">
          {/* Menu de tri rapide */}
          <select 
            value={sortBy} 
            onChange={(e) => onSortChange(e.target.value as any)}
            className="bg-white/5 border border-white/10 text-white text-xs font-bold rounded-full px-4 outline-none hover:bg-white/10 transition-colors cursor-pointer"
          >
            <option value="date" className="bg-zinc-900">Trier: Date</option>
            <option value="title" className="bg-zinc-900">Trier: Titre</option>
            <option value="artist" className="bg-zinc-900">Trier: Artiste</option>
          </select>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600 text-white font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_20px_var(--accent-glow)]"
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
            // @ts-ignore
            webkitdirectory="true" 
            directory="true"
            className="hidden" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          <div 
            onClick={() => onPlaylistClick('p1')}
            className="group bg-gradient-to-br from-violet-900 to-indigo-900 p-6 rounded-2xl cursor-pointer flex flex-col justify-end aspect-square relative overflow-hidden hover:scale-105 transition-all shadow-[0_10px_30px_rgba(143,0,255,0.15)] border border-white/5"
          >
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_60%_40%,#8F00FF,transparent)]" />
            <div className="relative z-10 mb-2 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
               <Heart size={20} fill="white" className="text-white" />
            </div>
            <h4 className="text-xl font-black text-white relative z-10 tracking-tighter">TITRES LIKÉS</h4>
            <p className="text-[10px] uppercase font-black text-white/60 relative z-10 tracking-widest">{favorites.length} morceaux</p>
            <button className="absolute top-4 right-4 w-12 h-12 bg-white text-violet-600 rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
              <Play size={20} fill="currentColor" className="ml-1" />
            </button>
          </div>

          {playlists.map(playlist => (
            <div 
              key={playlist.id} 
              onClick={() => onPlaylistClick(playlist.id)}
              className="group p-4 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-white/5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:scale-105 overflow-hidden" 
              style={{ background: 'var(--bg-card)' }}
            >
              <div className="relative aspect-square mb-4 shadow-2xl rounded-xl flex items-center justify-center overflow-hidden border border-white/5" style={{ background: 'var(--bg-card-hover)' }}>
                {playlist.tracks.length > 0 ? (
                  <img src={playlist.tracks[0].coverUrl} alt={playlist.name} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <Music size={40} className="text-white/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <button className="absolute bottom-3 right-3 w-12 h-12 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110">
                  <Play size={20} fill="currentColor" className="ml-1" />
                </button>
              </div>
              <h4 className="font-black truncate mb-0.5 text-sm uppercase tracking-tight text-white group-hover:text-violet-400 transition-colors">{playlist.name}</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{playlist.tracks.length} morceaux</p>
            </div>
          ))}
      </div>

      {localTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Musiques Locales</h3>
          </div>
          <div className="space-y-1">
            <div className="grid gap-4 px-4 pb-3 text-xs font-bold uppercase tracking-widest border-b border-white/5" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', color: 'var(--text-faint)' }}>
              <span>Titre</span>
              <span><Disc size={14} className="inline mr-1" /> Album</span>
              <span><User size={14} className="inline mr-1" /> Artiste</span>
              <span><Clock size={14} /></span>
            </div>
            {filteredLocalTracks.map(track => (
              <div 
                key={track.id} 
                className="grid gap-4 px-4 py-2 rounded-md hover:bg-white/5 group cursor-pointer items-center" 
                style={{ gridTemplateColumns: '1fr 1fr 1fr auto', color: 'var(--text-secondary)' }}
                onClick={() => playTrack(track, filteredLocalTracks)}
              >
                <span className="text-sm font-medium group-hover:text-violet-400 transition-colors truncate">{track.title}</span>
                <span className="text-sm truncate">{track.album}</span>
                <span className="text-sm truncate">{track.artist}</span>
                <span className="text-xs font-mono">
                  {track.duration > 0 ? formatTime(track.duration) : 'Locale'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl p-6" style={{ background: 'var(--bg-card)' }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Statistiques d'écoute</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-card-hover)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>Total des lectures</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalPlays}</p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-card-hover)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>Playlists créées</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{playlists.length}</p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-card-hover)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>Titres Likés</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{favorites.length}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
