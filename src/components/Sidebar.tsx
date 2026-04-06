import React from 'react';
import { Home, Search, Library, Play, Heart, X, Music, Sparkles, Plus } from 'lucide-react';
import { View, Playlist } from '../types';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

function SidebarItem({ icon, label, active = false, onClick, className }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
        active 
          ? "bg-white/10 text-white shadow-[0_10px_20px_rgba(0,0,0,0.2)]" 
          : "text-zinc-400 hover:text-white hover:bg-white/5",
        className
      )}
    >
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute left-0 w-1 h-6 bg-violet-500 rounded-r-full"
        />
      )}
      <div className={clsx(
        "transition-all duration-300 group-hover:scale-110 flex-shrink-0",
        active ? "text-violet-500" : "group-hover:text-white"
      )}>
        {icon}
      </div>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </button>
  );
}

interface SidebarProps {
  currentView: View;
  setCurrentView: (v: View) => void;
  playlists: Playlist[];
  youtubePlaylists?: any[];
  createPlaylist: () => void;
  onPlaylistClick?: (id: string, source?: string) => void;
  /* Mobile */
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ 
  currentView, setCurrentView, playlists, youtubePlaylists = [], createPlaylist, 
  onPlaylistClick, isOpen, onClose
}: SidebarProps) {
  const navigate = (v: View) => { setCurrentView(v); onClose(); };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={clsx(
          "fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 flex-shrink-0 transition-all duration-500 ease-in-out",
          "md:translate-x-0 bg-black border-r border-white/5",
          isOpen ? "translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)]" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-8 flex items-center justify-between">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('home')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20 rotate-3 group-hover:rotate-6 transition-transform">
              <Play size={20} fill="white" className="ml-0.5" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                Play Me
              </span>
            </h1>
          </motion.div>
          {/* Close on mobile */}
          <button onClick={onClose} className="md:hidden p-2 rounded-full hover:bg-white/10 text-zinc-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            <SidebarItem icon={<Home size={22} />} label="Accueil" active={currentView === 'home'} onClick={() => navigate('home')} />
            <SidebarItem icon={<Search size={22} />} label="Rechercher" active={currentView === 'search'} onClick={() => navigate('search')} />
            <SidebarItem icon={<Library size={22} />} label="Bibliothèque" active={currentView === 'library'} onClick={() => navigate('library')} />
            <SidebarItem icon={<Sparkles size={22} className="text-violet-400" />} label="AI Studio" active={currentView === 'ai-studio'} onClick={() => navigate('ai-studio')} />
          </div>

          <div className="pt-8 pb-4 px-4 flex items-center justify-between group">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Tes Playlists</p>
            <button 
              onClick={createPlaylist}
              className="p-1 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-1">
            <SidebarItem
              icon={<div className="bg-zinc-800 p-1.5 rounded-lg group-hover:bg-zinc-700 transition-colors"><Plus size={16} className="text-white" /></div>}
              label="Créer une playlist"
              onClick={createPlaylist}
            />
            <SidebarItem
              icon={<div className="bg-gradient-to-br from-indigo-700 to-violet-500 p-1.5 rounded-lg shadow-inner"><Heart size={16} fill="white" className="text-white" /></div>}
              label="Titres likés"
              active={currentView === 'playlist' && playlists.find(p => p.id === 'p1')?.id === 'p1'}
              onClick={() => onPlaylistClick?.('p1')}
            />
            <SidebarItem
              icon={<div className="bg-gradient-to-br from-emerald-600 to-teal-400 p-1.5 rounded-lg shadow-inner"><Music size={16} className="text-white" /></div>}
              label="Musique locale"
              onClick={() => onPlaylistClick?.('local-playlist')}
            />
          </div>

          <div className="mt-6 space-y-0.5 border-t border-white/5 pt-4 pb-8">
            {playlists
              .filter(p => !['p1', 'local-playlist'].includes(p.id))
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(p => (
                <button
                  key={p.id}
                  onClick={() => onPlaylistClick?.(p.id, 'local')}
                  className={clsx(
                    "w-full text-left px-4 py-2.5 text-sm font-bold truncate transition-all duration-300 rounded-xl",
                    currentView === 'playlist' && playlists.find(pl => pl.id === p.id)?.id === p.id
                      ? "text-violet-400 bg-violet-500/5"
                      : "text-zinc-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                  )}
                >
                  {p.name}
                </button>
              ))}
            {youtubePlaylists.length > 0 && (
              <>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-4 pt-4 pb-2">YouTube</p>
                {youtubePlaylists.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onPlaylistClick?.(p.id, 'youtube')}
                    className={clsx(
                      "w-full text-left px-4 py-2.5 text-sm font-bold truncate transition-all duration-300 rounded-xl",
                      currentView === 'playlist' // Need a way to check if it's the active youtube playlist, but this is fine for now
                        ? "text-zinc-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                        : "text-zinc-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </>
            )}
          </div>
        </nav>

        {/* Footer info */}
        <div className="p-6 border-t border-white/5">
          <div className="bg-gradient-to-br from-zinc-900 to-black p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Version Premium</p>
            <p className="text-xs text-zinc-400 leading-relaxed">Profitez de l'expérience complète sans publicité.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
