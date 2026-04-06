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
      return 0; // 'date' par défaut (ordre d'insertion)
    });

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header Premium */}
      <div className="relative pt-12 pb-8 group">
        {/* Background Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-[120%] bg-gradient-to-b from-violet-600/20 via-transparent to-transparent -z-10 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
        
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-56 h-56 md:w-72 md:h-72 flex-shrink-0"
          >
            <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-black rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-center justify-center border border-white/10 overflow-hidden relative group/cover">
              {playlist.tracks[0] ? (
                <img 
                  src={playlist.tracks[0].coverUrl} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/cover:scale-110" 
                  alt="" 
                />
              ) : (
                <Music size={100} className="text-violet-500/20" />
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
                 <button className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:scale-110 transition-transform">
                    <Play size={40} fill="white" className="ml-2" />
                 </button>
              </div>
            </div>
            {/* Glow projection */}
            <div className="absolute -inset-4 bg-violet-600/30 rounded-[3rem] blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>

          <div className="flex-1 text-center md:text-left">
            <motion.div
               initial={{ x: -20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
            >
              <p className="text-xs font-black uppercase tracking-[0.3em] text-violet-400 mb-3 drop-shadow-md">PLAYLIST PRIVÉE</p>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-violet-500/50 leading-tight">
                {playlist.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/50 font-bold text-sm md:text-base">
                 <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">{playlist.tracks.length} morceaux</div>
                 <div className="text-violet-500/60">•</div>
                 <div className="opacity-80 italic font-medium">{playlist.description || "Aucune description"}</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/5 backdrop-blur-xl border border-white/5 p-4 rounded-3xl sticky top-0 z-40 shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => filteredTracks[0] && playTrack(filteredTracks[0], filteredTracks)}
            className="px-8 h-14 rounded-full bg-violet-600 text-white font-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(143,0,255,0.4)] flex items-center gap-3"
          >
            <Play size={24} fill="white" />
            <span>ÉCOUTER TOUT</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`p-4 rounded-full transition-all ${showMenu ? 'bg-violet-600 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'}`}
            >
               <MoreHorizontal size={24} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[100]"
                >
                  <button 
                    onClick={() => {
                      const n = prompt('Nouveau nom :', playlist.name);
                      if (n) onRenamePlaylist?.(playlist.id, n);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-left transition-colors"
                  >
                    <Edit2 size={18} /> Renommer
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Supprimer cette playlist ?')) onDeletePlaylist?.(playlist.id);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-400 text-sm font-bold text-left transition-colors"
                  >
                    <Trash2 size={18} /> Supprimer
                  </button>
                  <hr className="border-white/5 my-1" />
                  <p className="text-[10px] font-black text-white/30 uppercase px-4 py-2">Trier par</p>
                  <button 
                    onClick={() => { onSortChange('title'); setShowMenu(false); }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-left transition-colors ${sortBy === 'title' ? 'text-violet-400' : 'text-white/60'}`}
                  >
                    Nom du titre
                  </button>
                  <button 
                    onClick={() => { onSortChange('artist'); setShowMenu(false); }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-left transition-colors ${sortBy === 'artist' ? 'text-violet-400' : 'text-white/60'}`}
                  >
                    Artiste
                  </button>
                  <button 
                    onClick={() => { onSortChange('date'); setShowMenu(false); }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-left transition-colors ${sortBy === 'date' ? 'text-violet-400' : 'text-white/60'}`}
                  >
                    Date d'ajout
                  </button>
                  <hr className="border-white/5 my-1" />
                  <button 
                    onClick={() => {
                      console.log('Lien de partage copié (simulation)');
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-left transition-colors"
                  >
                    <Share2 size={18} /> Partager
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Small Playlist Search Bar refinement */}
        <div className="relative group w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-violet-500 transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Rechercher dans la playlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-full py-3 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:bg-black/60 transition-all font-bold placeholder:text-white/20 text-white"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tracks List */}
      <div className="flex flex-col">
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-6 py-4 border-b border-white/5 text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
          <span className="w-10 text-center">#</span>
          <span>TITRE & ARTISTE</span>
          <Clock size={14} />
        </div>

        <div className="mt-4 min-h-[200px] space-y-1">
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => playTrack(track, filteredTracks)}
                className={`grid grid-cols-[auto_1fr_auto] gap-4 px-6 py-3 rounded-2xl cursor-pointer transition-all group items-center ${currentTrackId === track.id ? 'bg-violet-600/20 border border-violet-500/20' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className="w-10 flex items-center justify-center">
                  {currentTrackId === track.id ? (
                     <div className="flex items-end gap-0.5 h-4">
                        <motion.div animate={{ height: [6, 16, 6] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-violet-500 rounded-full" />
                        <motion.div animate={{ height: [12, 6, 12] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-violet-500 rounded-full" />
                        <motion.div animate={{ height: [8, 14, 8] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-violet-500 rounded-full" />
                     </div>
                  ) : (
                    <span className="text-white/20 group-hover:hidden font-mono text-sm">{String(i + 1).padStart(2, '0')}</span>
                  )}
                  <Play size={16} fill="currentColor" className="text-violet-500 hidden group-hover:block" />
                </div>

                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img src={track.coverUrl} className="w-12 h-12 rounded-xl object-cover shadow-lg" alt="" />
                    {currentTrackId === track.id && (
                       <div className="absolute inset-0 bg-violet-500/20 rounded-xl flex items-center justify-center">
                          <Music size={14} className="text-white animate-pulse" />
                       </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-black truncate text-sm md:text-base ${currentTrackId === track.id ? 'text-violet-400' : 'text-white'}`}>{track.title}</p>
                    <p className="text-xs text-white/40 font-bold truncate tracking-tight">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                   <div className="hidden md:block">
                      <span className="px-2 py-1 rounded-md bg-white/5 text-[9px] font-black text-white/30 border border-white/5 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                         {track.id.startsWith('local-') ? 'Local' : 'Youtube'}
                      </span>
                   </div>
                   <span className="text-xs text-white/30 font-mono font-bold w-12 text-right">
                     {track.duration > 0 ? formatTime(track.duration) : track.id.startsWith('local-') ? '...' : <span className="text-red-500">LIVE</span>}
                   </span>
                   
                   <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTrackMenu(activeTrackMenu === track.id ? null : track.id);
                        }}
                        className="p-2 text-white/20 hover:text-white transition-colors"
                      >
                        <MoreHorizontal size={20} />
                      </button>

                      <AnimatePresence>
                        {activeTrackMenu === track.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: -20 }}
                            className="absolute bottom-full right-0 mb-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-1 z-[110]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              onClick={() => {
                                onRemoveTrack?.(playlist.id, track.id);
                                setActiveTrackMenu(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 text-xs font-bold transition-colors"
                            >
                              <Trash2 size={14} /> Retirer de la playlist
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-white/20">
               <div className="p-8 rounded-full bg-white/5 mb-6">
                  <Search size={64} className="opacity-20" />
               </div>
               <p className="text-xl font-black">Aucun résultat trouvé</p>
               <p className="text-sm opacity-50 mb-6 font-bold uppercase tracking-widest mt-2 px-10 text-center">Nous n'avons trouvé aucun titre correspondant à votre recherche dans cette playlist.</p>
               <button onClick={() => setSearchQuery('')} className="px-8 py-3 bg-white/10 hover:bg-white text-black hover:text-black transition-all text-sm font-black rounded-full text-white">REINTIALISER LA RECHERCHE</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
