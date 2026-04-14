import * as React from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Music, Image as ImageIcon, Send, Loader2, Play, Download, Key } from 'lucide-react';
import { generateMusic, suggestMusicFromImage } from '../services/geminiService';
import { Track } from '../types';

interface AIStudioViewProps {
  onPlayTrack: (track: Track) => void;
}

/**
 * Studio Créatif View component.
 * Allows users to generate music using AI prompts or get recommendations from images.
 */
export const AIStudioView: React.FC<AIStudioViewProps> = ({ onPlayTrack }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<{ url: string, lyrics?: string } | null>(null);
  const [suggestedTracks, setSuggestedTracks] = useState<Track[]>([]);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Initializes the API key state.
   */
  React.useEffect(() => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      window.aistudio.hasSelectedApiKey().then(setHasApiKey);
    }
  }, []);

  /**
   * Opens the API key selection dialog.
   */
  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  /**
   * Generates music based on a text prompt.
   */
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
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handles image upload and calls suggestMusicFromImage.
   */
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
    <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-40">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF4067] to-[#FFA0B4] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF4067]/20">
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Studio Créatif</h1>
        </div>
        <p className="text-sm font-semibold max-w-xl" style={{ color: 'var(--text-secondary)' }}>
          Composez des musiques uniques avec l'IA ou laissez l'IA analyser vos images pour suggérer la musique idéale.
        </p>
      </header>

      {!hasApiKey && (
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-[32px] bg-white border border-black/5 shadow-sm flex flex-col md:flex-row items-center gap-6"
        >
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
            <Key className="text-gray-400" size={32} />
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Clé API manquante</h3>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Configurez votre clé Google Cloud pour débloquer les fonctionnalités Lyria.
            </p>
          </div>
          <button 
            onClick={handleSelectKey}
            className="px-8 py-3 bg-[var(--accent)] text-white rounded-full font-black text-sm shadow-lg shadow-[var(--accent)]/30 hover:translate-y-[-2px] transition-transform"
          >
            Configurer
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lyria Generator Case */}
        <section className="space-y-6 p-8 rounded-[40px] bg-white border border-black/5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Music className="text-[var(--accent)]" size={22} />
            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Lyria Gen</h2>
          </div>
          
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Décrivez l'ambiance..."
              className="w-full h-40 p-5 rounded-[24px] bg-gray-50 border border-transparent focus:border-[var(--accent)] focus:bg-white outline-none resize-none transition-all text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              onClick={handleGenerateMusic}
              disabled={isGenerating || !prompt.trim()}
              className="absolute bottom-4 right-4 h-12 w-12 bg-[var(--accent)] disabled:opacity-30 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className="ml-0.5" />}
            </button>
          </div>

          <AnimatePresence>
            {generatedAudio && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4 border-t border-black/5"
              >
                <div className="flex items-center justify-between p-4 rounded-3xl bg-gray-50 border border-black/5">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        const audio = document.getElementById('ai-audio-player') as HTMLAudioElement;
                        audio.play();
                      }}
                      className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center shadow-md"
                    >
                      <Play className="text-white" size={16} fill="white" />
                    </button>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Morceau Généré</p>
                      <p className="text-[10px] font-black uppercase text-[var(--accent)]">Prêt</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <audio src={generatedAudio.url} controls className="hidden" id="ai-audio-player" />
                    <a 
                      href={generatedAudio.url} 
                      download="lyria-generation.wav"
                      className="p-2 text-gray-400 hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                </div>
                {generatedAudio.lyrics && (
                  <div className="p-5 rounded-[24px] bg-gray-50 text-xs italic font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {generatedAudio.lyrics}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Visual Inspiration Section */}
        <section className="space-y-6 p-8 rounded-[40px] bg-white border border-black/5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="text-cyan-500" size={22} />
            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Inspi Visuelle</h2>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative w-full aspect-square rounded-[32px] border-2 border-dashed border-gray-100 hover:border-cyan-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <p className="text-white font-black text-xs uppercase tracking-widest">Changer</p>
                </div>
              </>
            ) : (
              <>
                <ImageIcon className="text-gray-200 mb-2" size={48} />
                <p className="text-xs font-bold text-gray-400">Uploader une image</p>
              </>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          <div className="space-y-3">
            {isAnalyzingImage && (
              <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-500 animate-pulse py-4">
                <Loader2 className="animate-spin" size={16} />
                Analyse...
              </div>
            )}
            
            <div className="space-y-2">
              {suggestedTracks.map((track) => (
                <div 
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-black/5 cursor-pointer transition-all group"
                >
                  <img src={track.coverUrl} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{track.title}</p>
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>{track.artist}</p>
                  </div>
                  <Play className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" size={18} fill="currentColor" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
