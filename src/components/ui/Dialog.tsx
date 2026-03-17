import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, HelpCircle, CheckCircle } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'error' | 'success' | 'confirm' | 'prompt';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: (value?: string) => void;
  defaultValue?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Annuler',
  onConfirm,
  defaultValue = ''
}: DialogProps) {
  const [inputValue, setInputValue] = React.useState(defaultValue);

  useEffect(() => {
    if (isOpen) setInputValue(defaultValue);
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    if (onConfirm) onConfirm(type === 'prompt' ? inputValue : undefined);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl p-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                {type === 'error' ? <AlertCircle size={32} /> : 
                 type === 'prompt' ? <HelpCircle size={32} /> :
                 type === 'success' ? <CheckCircle size={32} /> :
                 <AlertCircle size={32} />}
              </div>
              <div>
                <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                <p className="text-sm opacity-70" style={{ color: 'var(--text-secondary)' }}>{message}</p>
              </div>

              {type === 'prompt' && (
                <input
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none transition-all font-bold"
                  style={{ color: 'var(--text-primary)' }}
                />
              )}

              <div className="flex w-full gap-3 pt-2">
                {(type === 'confirm' || type === 'prompt') && (
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-500 text-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                >
                  {confirmText}
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors text-zinc-500"
            >
              <X size={18} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
