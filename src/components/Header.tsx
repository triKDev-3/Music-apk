import React from 'react';
import { Search, Menu, Mic, Sun, Moon } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onMenuOpen: () => void;
  user: any;
  authLoading: boolean;
  isScanning?: boolean;
  onRecognitionOpen: () => void;
}

/**
 * Header component featuring search bar, user profile, and music recognition.
 */
export function Header({
  searchQuery, setSearchQuery, handleSearch,
  onMenuOpen, user, authLoading, onRecognitionOpen,
  theme, toggleTheme
}: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Hamburger */}
      <button
        onClick={onMenuOpen}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-black/5 active:scale-95"
        style={{ color: 'var(--text-primary)' }}
      >
        <Menu size={22} />
      </button>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-1 mx-3 relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-faint)' }}
        />
        <input
          type="text"
          placeholder="Rechercher…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm outline-none transition-all"
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.08)'; }}
        />
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onRecognitionOpen}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-black/5 active:scale-95"
          style={{ color: 'var(--text-secondary)' }}
          title="Reconnaître une chanson"
        >
          <Mic size={20} />
        </button>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-black/5 active:scale-95"
          style={{ color: 'var(--text-secondary)' }}
          title={theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <UserMenu user={user} loading={authLoading} />
      </div>
    </header>
  );
}
