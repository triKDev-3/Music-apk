import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Loader2, Music, Youtube, CheckCircle2, AlertCircle, Radio, Sparkles, Play } from 'lucide-react';
import { identifyMusic } from '../services/recognitionService';
import { Track } from '../types';

interface RecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (track: Track) => void;
}

type RecognitionState = 'IDLE' | 'LISTENING' | 'IDENTIFYING' | 'SUCCESS' | 'ERROR';

export function RecognitionModal({ isOpen, onClose, onResult }: RecognitionModalProps) {
  const [state, setState] = useState<RecognitionState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [detectedTrack, setDetectedTrack] = useState<Track | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Analyse du volume pour l'animation
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolumeLevel(average / 128);
        animationRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setState('IDENTIFYING');
        
        try {
          const result = await identifyMusic(audioBlob);
          if (result) {
            setDetectedTrack(result);
            setState('SUCCESS');
            setTimeout(() => {
              onResult(result);
              onClose();
            }, 2000);
          } else {
            setError("Impossible d'identifier cette chanson. Essayez de vous rapprocher de la source sonore.");
            setState('ERROR');
          }
        } catch (err) {
          setError("Une erreur est survenue lors de l'identification.");
          setState('ERROR');
        }

        // Cleanup
        stream.getTracks().forEach(t => t.stop());
        audioContext.close();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };

      mediaRecorder.start();
      setState('LISTENING');
      setError(null);

      // Arrêt automatique après 8 secondes
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') stopRecording();
      }, 8000);

    } catch (err: any) {
      console.error('Mic access denied:', err);
      setState('ERROR');
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        setError("L'accès au micro est bloqué par le navigateur.");
      } else {
        setError(`Erreur micro: ${err.message}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setState('IDLE');
      setError(null);
      setVolumeLevel(0);
      setDetectedTrack(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
          onClick={onClose}
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden p-8 md:p-12 flex flex-col items-center text-center group"
        >
          {/* Animated Background Orbs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
             <div 
               className="absolute top-[-50px] right-[-50px] w-64 h-64 rounded-full blur-[100px] transition-colors duration-1000"
               style={{ background: state === 'LISTENING' ? '#10b981' : state === 'SUCCESS' ? '#8b5cf6' : '#8b5cf6' }}
             />
             <div 
               className="absolute bottom-[-50px] left-[-50px] w-64 h-64 rounded-full blur-[100px] transition-colors duration-1000"
               style={{ background: state === 'LISTENING' ? '#8b5cf6' : state === 'IDLE' ? '#3b82f6' : '#10b981' }}
             />
          </div>

          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all z-20"
          >
            <X size={20} />
          </button>

          <header className="mb-10 relative z-10">
             <div className="flex items-center justify-center gap-2 mb-3">
                <Radio size={12} className={state === 'LISTENING' ? 'text-emerald-500 animate-pulse' : 'text-violet-500'} />
                <span className="text-[10px] uppercase font-black tracking-[0.4em] text-white/40">Discover Music</span>
             </div>
             <h2 className="text-4xl font-black text-white tracking-tighter">Play-Me Identifie</h2>
          </header>

          {/* Central Experience */}
          <div className="relative mb-12 flex items-center justify-center h-48 w-full z-10">
             <AnimatePresence mode="wait">
                {state === 'SUCCESS' && detectedTrack ? (
                  <motion.div 
                    key="success"
                    initial={{ scale: 0, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-4">
                       <img 
                          src={detectedTrack.coverUrl} 
                          alt="Cover" 
                          className="w-36 h-36 rounded-2xl object-cover shadow-2xl border-4 border-violet-500/30" 
                       />
                       <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center shadow-lg border-2 border-zinc-900">
                          <CheckCircle2 size={24} className="text-white" />
                       </div>
                    </div>
                    <div>
                       <p className="font-black text-white text-lg truncate w-64">{detectedTrack.title}</p>
                       <p className="text-violet-400 font-bold uppercase tracking-widest text-[10px]">{detectedTrack.artist}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="main" className="relative flex items-center justify-center">
                    {/* Ripple Effects during listening */}
                    {state === 'LISTENING' && (
                       <>
                         <motion.div 
                           animate={{ scale: [1, 2 + volumeLevel], opacity: [0.3, 0] }}
                           transition={{ duration: 1, repeat: Infinity }}
                           className="absolute w-32 h-32 bg-emerald-500 rounded-full blur-xl"
                         />
                         <motion.div 
                           animate={{ scale: [1, 3], opacity: [0.1, 0] }}
                           transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                           className="absolute w-32 h-32 bg-violet-600 rounded-full blur-2xl"
                         />
                       </>
                    )}

                    <button
                       onClick={state === 'LISTENING' ? stopRecording : startRecording}
                       disabled={state === 'IDENTIFYING'}
                       className={`relative z-20 w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-700 shadow-2xl ${
                          state === 'LISTENING' 
                            ? 'bg-emerald-500 text-white shadow-[0_0_80px_rgba(16,185,129,0.4)] scale-110' 
                            : state === 'IDENTIFYING'
                            ? 'bg-zinc-800 text-violet-500 cursor-wait'
                            : 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] active:scale-95'
                       }`}
                    >
                       {state === 'IDENTIFYING' ? (
                         <div className="relative">
                           <Loader2 size={56} className="animate-spin" />
                           <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
                         </div>
                       ) : state === 'LISTENING' ? (
                         <div className="flex flex-col items-center gap-1">
                           <div className="flex gap-1 items-end h-8 mb-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <motion.div 
                                  key={i}
                                  animate={{ height: [8, 20 + (Math.random() * 20 * volumeLevel), 8] }}
                                  transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                                  className="w-1.5 bg-black rounded-full"
                                />
                              ))}
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-tighter">Stop</span>
                         </div>
                       ) : state === 'ERROR' ? (
                         <AlertCircle size={56} className="text-white/50" />
                       ) : (
                         <Mic size={56} fill="currentColor" className="drop-shadow-lg" />
                       )}
                    </button>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          <footer className="space-y-6 w-full relative z-10">
             <div className="h-6">
                <AnimatePresence mode="wait">
                  {state === 'SUCCESS' ? (
                    <motion.p 
                      key="s" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                      className="text-emerald-400 font-black text-xs uppercase tracking-widest"
                    >
                      Victoire ! Lancement du titre...
                    </motion.p>
                  ) : state === 'IDENTIFYING' ? (
                    <motion.p 
                      key="i" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                      className="text-zinc-400 font-bold text-sm animate-pulse"
                    >
                      On compare l'empreinte sonore...
                    </motion.p>
                  ) : state === 'LISTENING' ? (
                    <motion.p 
                      key="l" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                      className="text-emerald-400 font-bold text-sm"
                    >
                      Écoute active... Rapprochez le micro.
                    </motion.p>
                  ) : state === 'ERROR' ? (
                    <motion.div 
                      key="e" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                       <p className="text-red-400 text-xs font-medium px-4">{error}</p>
                       <button onClick={startRecording} className="text-[10px] font-black uppercase text-white/40 hover:text-white underline tracking-widest">Réessayer</button>
                    </motion.div>
                  ) : (
                    <motion.p key="id" className="text-white/40 text-sm font-medium">
                       Appuyez sur le micro pour identifier n'importe quel son
                    </motion.p>
                  )}
                </AnimatePresence>
             </div>

             <div className="pt-8 border-t border-white/5 flex items-center justify-around text-zinc-600 group-hover:text-zinc-500 transition-colors">
                <div className="flex flex-col items-center gap-1">
                   <Youtube size={16} />
                   <span className="text-[8px] font-black uppercase tracking-tighter">HD Clip</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                   <Music size={16} />
                   <span className="text-[8px] font-black uppercase tracking-tighter">Lyrics</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                   <Radio size={16} />
                   <span className="text-[8px] font-black uppercase tracking-tighter">Match</span>
                </div>
             </div>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
