import React from 'react';
import { Home, Search, Library, Play, Heart, X, Music, Sparkles } from 'lucide-react';
import { View, Playlist } from '../types';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, active = false, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-3 py-2 rounded-md transition-all group"
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: active ? 'var(--bg-card)' : 'transparent',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >
      <div className="transition-transform group-hover:scale-110 flex-shrink-0">{icon}</div>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

interface SidebarProps {
  currentView: View;
  setCurrentView: (v: View) => void;
  playlists: Playlist[];
  createPlaylist: () => void;
  onPlaylistClick?: (id: string) => void;
  /* Mobile */
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ 
  currentView, setCurrentView, playlists, createPlaylist, 
  onPlaylistClick, isOpen, onClose
}: SidebarProps) {
  const navigate = (v: View) => { setCurrentView(v); onClose(); };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed md:static inset-y-0 left-0 z-50 flex flex-col w-64 flex-shrink-0 transition-transform duration-300',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(143,0,255,0.4)]">
              <Play size={16} fill="white" className="ml-0.5" />
            </div>
            Play Me
          </h1>
          {/* Close on mobile */}
          <button onClick={onClose} className="md:hidden p-1 rounded" style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <SidebarItem icon={<Home size={20} />} label="Home" active={currentView === 'home'} onClick={() => navigate('home')} />
          <SidebarItem icon={<Search size={20} />} label="Search" active={currentView === 'search'} onClick={() => navigate('search')} />
          <SidebarItem icon={<Library size={20} />} label="Your Library" active={currentView === 'library'} onClick={() => navigate('library')} />
          <SidebarItem icon={<Sparkles size={20} className="text-violet-400" />} label="AI Studio" active={currentView === 'ai-studio'} onClick={() => navigate('ai-studio')} />

          <div className="pt-6 pb-2 px-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Playlists</p>
          </div>

          <SidebarItem
            icon={<div style={{ background: 'var(--bg-card)' }} className="p-1 rounded"><Play size={14} style={{ color: 'var(--text-primary)' }} /></div>}
            label="Create Playlist"
            onClick={createPlaylist}
          />
          <SidebarItem
            icon={<div className="bg-gradient-to-br from-indigo-700 to-blue-300 p-1 rounded"><Heart size={14} fill="white" /></div>}
            label="Titres likés"
            onClick={() => onPlaylistClick?.('p1')}
          />
          <SidebarItem
            icon={<div className="bg-gradient-to-br from-emerald-600 to-teal-400 p-1 rounded"><Music size={14} fill="white" /></div>}
            label="Musique locale"
            onClick={() => onPlaylistClick?.('local-playlist')}
          />

          <div className="mt-4 space-y-1">
            {playlists
              .filter(p => !['p1', 'local-playlist'].includes(p.id))
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(p => (
                <button
                  key={p.id}
                  onClick={() => onPlaylistClick?.(p.id)}
                  className="w-full text-left px-3 py-2 text-sm truncate transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  {p.name}
                </button>
              ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
