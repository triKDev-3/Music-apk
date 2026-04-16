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

/**
 * Sidebar navigation item.
 */
function SidebarItem({ icon, label, active = false, onClick, className }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
        active 
          ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[0_8px_20px_rgba(0,0,0,0.2)]" 
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
        className
      )}
    >
      <div className={clsx(
        "transition-all duration-300 group-hover:scale-110 flex-shrink-0",
        active ? "text-[var(--accent)]" : "group-hover:text-[var(--text-primary)]"
      )}>
        {icon}
      </div>
      <span className="text-sm font-bold tracking-tight">{label}</span>
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute right-0 w-1 h-6 bg-[var(--accent)] rounded-l-full"
        />
      )}
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

/**
 * Sidebar component providing primary navigation and playlist access.
 */
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
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={clsx(
          "fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 flex-shrink-0 transition-all duration-500 ease-in-out",
          "md:translate-x-0 bg-[var(--bg-sidebar)] border-r border-[var(--border)]",
          isOpen ? "translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.05)]" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-8 flex items-center justify-between">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('home')}
          >
            <div className="w-10 h-10 bg-[var(--accent)] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--accent)]/20 rotate-3">
              <Play size={20} fill="white" color="white" className="ml-0.5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">
                ON<span className="text-[var(--accent)]">Music</span>
              </h1>
              <span className="text-[9px] font-bold text-[var(--text-secondary)] leading-none mt-1">The entire music universe,<br/>finally in sync</span>
            </div>
          </motion.div>
          {/* Close on mobile */}
          <button onClick={onClose} className="md:hidden p-2 rounded-full hover:bg-black/5 text-[var(--text-secondary)] transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            <SidebarItem icon={<Home size={22} />} label="Accueil" active={currentView === 'home'} onClick={() => navigate('home')} />
            <SidebarItem icon={<Search size={22} />} label="Rechercher" active={currentView === 'search'} onClick={() => navigate('search')} />
            <SidebarItem icon={<Library size={22} />} label="Bibliothèque" active={currentView === 'library'} onClick={() => navigate('library')} />
            <SidebarItem icon={<Sparkles size={22} className="text-[var(--accent)]" />} label="Studio Créatif" active={currentView === 'ai-studio'} onClick={() => navigate('ai-studio')} />
          </div>

          <div className="pt-8 pb-4 px-4 flex items-center justify-between group">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)]">Tes Playlists</p>
            <button 
              onClick={createPlaylist}
              className="p-1 rounded-full hover:bg-black/5 text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-all opacity-0 group-hover:opacity-100"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-1">
            <SidebarItem
              icon={<div className="bg-[var(--bg-card)] p-1.5 rounded-lg border border-[var(--border)]"><Plus size={16} className="text-[var(--text-primary)]" /></div>}
              label="Créer une playlist"
              onClick={createPlaylist}
            />
            <SidebarItem
              icon={<div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-inner"><Heart size={16} fill="white" color="white" className="text-white" /></div>}
              label="Titres likés"
              active={currentView === 'playlist' && playlists.find(p => p.id === 'p1')?.id === 'p1'}
              onClick={() => onPlaylistClick?.('p1')}
            />
            <SidebarItem
              icon={<div className="bg-emerald-500 p-1.5 rounded-lg shadow-inner"><Music size={16} color="white" className="text-white" /></div>}
              label="Musique locale"
              onClick={() => onPlaylistClick?.('local-playlist')}
            />
          </div>

          <div className="mt-6 space-y-0.5 border-t border-[var(--border)] pt-4 pb-8">
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
                      ? "text-[var(--accent)] bg-[var(--accent)]/5"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:translate-x-1"
                  )}
                >
                  {p.name}
                </button>
              ))}
          </div>
        </nav>

        {/* Footer info */}
        <div className="p-6 border-t border-[var(--border)]">
          <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <p className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest mb-1">Version Premium</p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Profitez de l'expérience complète sans publicité.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
