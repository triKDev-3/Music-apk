import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, X, Settings } from 'lucide-react';

export function PermissionBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSecureOrigin, setIsSecureOrigin] = useState(true);

  useEffect(() => {
    // Vérifier si le contexte est sécurisé (localhost ou HTTPS ou file)
    const secure = window.isSecureContext;
    setIsSecureOrigin(secure);

    // Si pas sécurisé et sur une IP locale, on affiche l'aide
    if (!secure && window.location.hostname !== 'localhost') {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-2xl"
      >
        <div className="bg-zinc-900/90 backdrop-blur-2xl border border-yellow-500/30 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="text-yellow-500" size={24} />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-sm font-bold text-white mb-1">Attention: Connexion non sécurisée détectée</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Le micro et l'authentification peuvent être bloqués sur <span className="text-yellow-500 font-mono">{window.location.hostname}</span>. 
              Utilisez <span className="text-violet-400 font-bold">localhost:3000</span> ou configurez les 
              <span className="text-violet-400 font-bold"> chrome://flags </span> pour autoriser cette IP.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsVisible(false)}
              className="px-4 py-2 text-xs font-bold text-white/40 hover:text-white transition-colors"
            >
              Ignorer
            </button>
            <button 
              onClick={() => window.open('https://github.com/GoogleChrome/chrome-launcher/blob/master/docs/chrome-flags-for-tools.md', '_blank')}
              className="px-4 py-2 bg-yellow-500 text-black text-xs font-black uppercase rounded-lg hover:scale-105 transition-all shadow-lg flex items-center gap-2"
            >
              <Settings size={14} /> Aide
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
