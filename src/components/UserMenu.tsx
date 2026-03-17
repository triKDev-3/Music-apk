import React, { useState } from 'react';
import { LogIn, LogOut, User as UserIcon, ChevronDown, Youtube } from 'lucide-react';
import { loginWithGoogle, logout, type User } from '../services/firebaseService';

interface UserMenuProps {
  user: User | null;
  loading: boolean;
}

export function UserMenu({ user, loading }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: 'var(--bg-card)' }} />
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => loginWithGoogle()}
        title="Connecte-toi pour accéder à la recherche YouTube en temps réel"
        className="flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-full hover:scale-105 transition-transform"
        style={{ background: '#10b981', color: '#000' }}
      >
        <LogIn size={15} />
        Connexion
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1 rounded-full transition-all"
        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || ''} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
            <UserIcon size={14} />
          </div>
        )}
        <span className="text-sm font-bold max-w-[80px] truncate hidden sm:block">
          {user.displayName?.split(' ')[0]}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl overflow-hidden z-50"
          style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user.displayName}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
          </div>
          <button
            onClick={() => { logout(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <LogOut size={15} />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
