import React, { useState } from 'react';
import { Shield, Check, Scale, Fingerprint, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LegalLayoutProps {
  onAccept: () => void;
}

/**
 * LegalLayout component displaying Terms of Service and Privacy Policy.
 * Must be accepted before accessing the app.
 */
export const LegalLayout: React.FC<LegalLayoutProps> = ({ onAccept }) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-[var(--bg-card)] rounded-[48px] shadow-2xl border border-[var(--border)] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-10 border-b border-[var(--border)] flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-3xl flex items-center justify-center">
            <Shield className="text-[var(--accent)]" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
              Bienvenue sur ONMusic
            </h1>
            <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
              Veuillez lire et accepter nos conditions pour continuer.
            </p>
          </div>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar"
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) setHasScrolled(true);
          }}
        >
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Scale size={20} className="text-[var(--accent)]" />
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-[var(--text-primary)]">Conditions d'Utilisation</h2>
            </div>
            <p className="text-sm leading-relaxed font-medium text-[var(--text-secondary)]">
              En utilisant ONMusic, vous acceptez que l'application puisse indexer vos fichiers musicaux locaux pour une lecture fluide et utiliser l'API YouTube pour le streaming. Vous vous engagez à ne pas utiliser l'application pour des activités illégales ou violant les droits d'auteur.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Fingerprint size={20} className="text-cyan-500" />
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-[var(--text-primary)]">Confidentialité</h2>
            </div>
            <p className="text-sm leading-relaxed font-medium text-[var(--text-secondary)]">
              Vos données de navigation, vos favoris et vos statistiques de lecture sont stockés soit localement, soit de manière sécurisée sur nos serveurs Cloud (si connecté). Nous n'utilisons pas vos données à des fins publicitaires.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-emerald-500" />
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-[var(--text-primary)]">Sécurité</h2>
            </div>
            <p className="text-sm leading-relaxed font-medium text-[var(--text-secondary)]">
              Nous utilisons des protocoles d'authentification standard (OAuth 2.0 via Google) pour garantir la sécurité de votre compte et de vos playlists YouTube.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-10 bg-[var(--bg-hover)] border-t border-[var(--border)] space-y-6">
          <label className="flex items-start gap-4 cursor-pointer group">
            <div className="relative mt-0.5">
              <input 
                type="checkbox" 
                checked={accepted} 
                onChange={(e) => setAccepted(e.target.checked)}
                className="peer hidden"
              />
              <div className="w-6 h-6 rounded-lg border-2 border-gray-200 peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent)] transition-all flex items-center justify-center">
                <Check size={14} className="text-white opacity-0 peer-checked:opacity-100" />
              </div>
            </div>
            <span className="text-xs font-bold leading-relaxed text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
              J'ai lu et j'accepte les Conditions d'Utilisation ainsi que la Politique de Confidentialité de ONMusic.
            </span>
          </label>

          <button
            onClick={onAccept}
            disabled={!accepted}
            className="w-full py-5 bg-[var(--accent)] disabled:opacity-30 text-white rounded-[24px] font-black tracking-wide shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            COMMENCER L'EXPÉRIENCE
          </button>
        </div>
      </motion.div>
    </div>
  );
};
