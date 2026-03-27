import React from 'react';
import { ChevronLeft, ChevronRight, Search, Sun, Moon, Menu, RefreshCw, Mic } from 'lucide-react';
import { Theme, type User } from '../types';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  theme: Theme;
  toggleTheme: () => void;
  onMenuOpen: () => void;
  user: User | null;
  authLoading: boolean;
  isScanning?: boolean;
  onRecognitionOpen: () => void;
}

export function Header({
  searchQuery, setSearchQuery, handleSearch,
  theme, toggleTheme, onMenuOpen,
  user, authLoading, isScanning, onRecognitionOpen
}: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 z-10 flex-shrink-0">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuOpen}
          className="md:hidden w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
        >
          <Menu size={20} />
        </button>

        {/* Nav arrows — desktop only */}
        <div className="hidden md:flex gap-2">
          {[ChevronLeft, ChevronRight].map((Icon, i) => (
            <button
              key={i}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} style={{ color: 'var(--text-faint)' }} />
          <input
            type="text"
            placeholder="Rechercher avec l'IA..."
            className="outline-none rounded-full py-2 pl-9 pr-12 text-sm transition-all w-40 sm:w-52 md:w-80"
            style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid transparent' }}
            onFocus={e => { e.target.style.background = 'var(--input-hover)'; e.target.style.borderColor = 'var(--accent)'; }}
            onBlur={e => { e.target.style.background = 'var(--input-bg)'; e.target.style.borderColor = 'transparent'; }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center bg-violet-500/10 px-1.5 py-0.5 rounded-full border border-violet-500/20 group-focus-within:bg-violet-500/20 transition-colors">
            <span className="text-[8px] font-black text-violet-400 mr-1 uppercase tracking-tighter">AI</span>
            <RefreshCw size={10} className="text-violet-400 animate-pulse" />
          </div>
        </form>

        <button
          onClick={onRecognitionOpen}
          title="Identifier une chanson"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-violet-600/10 text-violet-500 hover:bg-violet-600 hover:text-white transition-all shadow-sm hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]"
        >
          <Mic size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {isScanning && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
             <RefreshCw size={12} className="animate-spin" />
             <span className="hidden sm:inline">Sync...</span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User auth */}
        <UserMenu user={user} loading={authLoading} />
      </div>
    </header>
  );
}
