import * as React from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Music, Image as ImageIcon, Send, Loader2, Play, Download, Trash2, Key } from 'lucide-react';
import { generateMusic, suggestMusicFromImage } from '../services/geminiService';
import { Track } from '../types';

interface AIStudioViewProps {
  onPlayTrack: (track: Track) => void;
}

export const AIStudioView: React.FC<AIStudioViewProps> = ({ onPlayTrack }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<{ url: string, lyrics?: string } | null>(null);
  const [suggestedTracks, setSuggestedTracks] = useState<Track[]>([]);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      window.aistudio.hasSelectedApiKey().then(setHasApiKey);
    }
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleGenerateMusic = async () => {
    if (!prompt.trim()) return;
    
    if (!hasApiKey) {
      await handleSelectKey();
    }

    setIsGenerating(true);
    try {
      const result = await generateMusic(prompt);
      setGeneratedAudio(result);
    } catch (err) {
      console.error('Generation failed:', err);
      console.error('Échec de la génération. Assurez-vous d\'avoir configuré une clé API valide.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      setSelectedImage(event.target?.result as string);
      
      setIsAnalyzingImage(true);
      try {
        const tracks = await suggestMusicFromImage(base64, file.type);
        setSuggestedTracks(tracks);
      } catch (err) {
        console.error('Image analysis failed:', err);
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg shadow-violet-500/20">
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">AI Studio</h1>
        </div>
        <p className="text-[var(--text-secondary)] max-w-2xl">
          Générez des morceaux uniques avec Lyria ou laissez l'IA analyser vos images pour créer la playlist parfaite.
        </p>
      </header>

      {!hasApiKey && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="p-4 bg-violet-500/20 rounded-full">
            <Key className="text-violet-400" size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold">Clé API Requise</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Pour utiliser les modèles avancés comme Lyria, vous devez sélectionner votre propre clé API Google Cloud.
            </p>
          </div>
          <button 
            onClick={handleSelectKey}
            className="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-500/30"
          >
            Configurer la clé
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section Génération de Musique */}
        <section className="space-y-4 p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <Music className="text-emerald-400" size={20} />
            <h2 className="text-xl font-bold">Générateur Lyria</h2>
          </div>
          
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Décrivez la musique que vous voulez (ex: Un morceau de jazz relaxant avec un piano doux et une contrebasse...)"
              className="w-full h-32 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] focus:border-violet-500 outline-none resize-none transition-all text-sm"
            />
            <button
              onClick={handleGenerateMusic}
              disabled={isGenerating || !prompt.trim()}
              className="absolute bottom-4 right-4 p-3 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg transition-all"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>

          <AnimatePresence>
            {generatedAudio && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4 border-t border-[var(--border)]"
              >
                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500 rounded-full">
                      <Play className="text-white" size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Morceau Généré</p>
                      <p className="text-xs text-emerald-400">Prêt à l'écoute</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <audio src={generatedAudio.url} controls className="hidden" id="ai-audio-player" />
                    <button 
                      onClick={() => {
                        const audio = document.getElementById('ai-audio-player') as HTMLAudioElement;
                        audio.play();
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Play size={20} />
                    </button>
                    <a 
                      href={generatedAudio.url} 
                      download="lyria-generation.wav"
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                </div>
                {generatedAudio.lyrics && (
                  <div className="p-4 rounded-2xl bg-[var(--input-bg)] text-xs italic text-[var(--text-secondary)] line-clamp-4">
                    {generatedAudio.lyrics}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Section Analyse d'Image */}
        <section className="space-y-4 p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="text-cyan-400" size={20} />
            <h2 className="text-xl font-bold">Inspiration Visuelle</h2>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative w-full aspect-video rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-cyan-500/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white font-bold text-sm">Changer d'image</p>
                </div>
              </>
            ) : (
              <>
                <ImageIcon className="text-[var(--text-faint)] mb-2" size={40} />
                <p className="text-sm text-[var(--text-secondary)]">Cliquez pour uploader une image</p>
              </>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          <div className="space-y-2">
            {isAnalyzingImage && (
              <div className="flex items-center gap-2 text-sm text-cyan-400 animate-pulse">
                <Loader2 className="animate-spin" size={16} />
                Analyse de l'ambiance...
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-2">
              {suggestedTracks.map((track) => (
                <div 
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <img src={track.coverUrl} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{track.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{track.artist}</p>
                  </div>
                  <Play className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
