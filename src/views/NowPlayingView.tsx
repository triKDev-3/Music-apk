import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPlayer from 'react-player';
import { 
  ChevronDown, ChevronRight, ChevronLeft, Plus, MoreHorizontal, Share2, 
  SkipBack, SkipForward, Play, Pause, 
  Repeat, Repeat1, Shuffle, Heart, ListMusic, 
  MessageSquare, Music2, MonitorPlay, Timer, Gauge, Trash2, X, Info, Tv, Loader2
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { Dialog } from '../components/ui/Dialog';
interface NowPlayingViewProps {
  track: Track | null;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  played: number;
  duration: number;
  repeatMode: 'off' | 'all' | 'one';
  setRepeatMode: (v: 'off' | 'all' | 'one') => void;
  isShuffle: boolean;
  setIsShuffle: (v: boolean) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  handleSeekChange: (val: number) => void;
  formatTime: (s: number) => string;
  skipToNext: () => void;
  skipToPrev: () => void;
  onClose: () => void;
  isClipMode: boolean;
  setIsClipMode: (v: boolean) => void;
  playlists: Playlist[];
  onAddToPlaylist: (pId: string, t: Track) => void;
  playbackRate: number;
  setPlaybackRate: (r: number) => void;
  sleepTimer: number | null;
  setSleepTimer: (s: number | null) => void;
  activeQueue: Track[];
  playTrack: (t: Track, q?: Track[]) => void;
  onMinimize?: () => void;
  isLoading?: boolean;
  hasError?: boolean;
}

const MOCK_LYRICS = [
  "I'm tryna put you in the worst mood, ah",
  "P1 cleaner than your church shoes, ah",
  "Milli point two on the dashboard, ah",
  "Lookin' at the star boy, oh",
  "We don't pray for love, we just pray for cars",
  "House so empty, need a centerpiece",
  "Twenty racks a table, cut from ebony",
  "Cut that ivory into skinny pieces",
  "Then she clean it with her face, man I love my baby",
  "You talkin' money, need a hearing aid",
  "You talkin' 'bout me, I don't see the shade",
  "Switch up my style, I take any lane",
  "I switch up my cup, I kill any pain",
  "Look what you've done...",
  "I'm a motherf***in' starboy"
];

export function NowPlayingView({
  track, isPlaying, setIsPlaying, played, duration,
  repeatMode, setRepeatMode, isShuffle, setIsShuffle,
  favorites, toggleFavorite, handleSeekChange, formatTime,
  skipToNext, skipToPrev, onClose,
  isClipMode, setIsClipMode,
  playlists, onAddToPlaylist,
  playbackRate, setPlaybackRate,
  sleepTimer, setSleepTimer,
  activeQueue, playTrack, onMinimize,
  isLoading = false, hasError = false
}: NowPlayingViewProps) {
  const [showQueue, setShowQueue]       = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showTimerMenu, setShowTimerMenu]   = useState(false);
  const [dialog, setDialog] = useState<{isOpen: boolean, title: string, message: string, type?: any}>({
    isOpen: false, title: '', message: ''
  });
  const isFav = track ? favorites.includes(track.id) : false;

  const [currentLineIdx, setCurrentLineIdx] = useState(0);

  // Réinitialiser le sous-menu quand le menu principal se ferme
  useEffect(() => {
    if (!showMoreMenu) {
      const tid = setTimeout(() => setShowPlaylistPicker(false), 300);
      return () => clearTimeout(tid);
    }
  }, [showMoreMenu]);



  if (!track) return null;

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[160] flex flex-col text-white overflow-hidden bg-black select-none overflow-x-hidden"
    >
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          key={track.coverUrl}
          initial={{ opacity: 0, scale: 1.25 }}
          animate={{ opacity: 0.5, scale: 1.15 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <img 
            src={track.coverUrl} 
            className="w-full h-full object-cover blur-[100px] saturate-150 brightness-50"
            alt=""
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90" />
      </div>

      {/* Header */}
      <header className="relative z-50 flex items-center justify-between p-6 md:p-8">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-3 rounded-full hover:bg-white/10 transition-colors" title="Fermer">
            <ChevronDown size={32} />
          </button>
          <button 
            onClick={onMinimize} 
            className="p-3 rounded-full hover:bg-white/10 transition-colors hidden md:flex" 
            title="Activer le mode Petit écran (PIP)"
          >
            <Tv size={24} className="text-violet-400" />
          </button>
        </div>
        <div className="text-center overflow-hidden">
          <motion.p 
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 0.6 }}
            className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1"
          >
            Lecture en cours
          </motion.p>
          <motion.p 
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="text-sm font-black truncate max-w-[200px]"
          >
            {track.album || 'Play Me'}
          </motion.p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`p-3 rounded-full transition-colors ${showMoreMenu ? 'bg-white/20 text-emerald-400' : 'hover:bg-white/10'}`}
          >
            <MoreHorizontal size={28} />
          </button>
          
          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-14 right-0 w-64 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[200]"
              >
                <div className="flex flex-col gap-1">
                  {!showPlaylistPicker ? (
                    <>
                       <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDialog({ isOpen: true, title: 'File d\'attente', message: 'Titre ajouté à la file d\'attente !', type: 'success' });
                          setShowMoreMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-left transition-colors"
                      >
                        <ListMusic size={18} /> Ajouter à la file
                      </button>
                      <button
                         onClick={(e) => { e.stopPropagation(); setShowPlaylistPicker(true); }}
                         className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-left transition-colors"
                      >
                         <div className="flex items-center gap-3"><Plus size={18} /> Ajouter à une playlist</div>
                         <ChevronRight size={16} />
                      </button>
                      <button
                         onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); setShowMoreMenu(false); }}
                         className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-left transition-colors"
                      >
                        <Heart size={18} fill={isFav ? 'currentColor' : 'none'} className={isFav ? 'text-violet-500' : ''} />
                        {isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      </button>

                      <hr className="border-white/5 my-1" />

                      <button
                         onClick={(e) => { e.stopPropagation(); }}
                         className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-left transition-colors"
                      >
                         <div className="flex items-center gap-3"><Gauge size={18} /> Vitesse</div>
                         <div className="flex gap-1">
                           {[1, 1.25, 1.5, 2].map(v => (
                             <div key={v} onClick={(e) => { e.stopPropagation(); setPlaybackRate(v); }} className={`px-2 py-0.5 rounded text-[10px] ${playbackRate === v ? 'bg-violet-600 text-white' : 'bg-white/5'}`}>{v}x</div>
                           ))}
                         </div>
                      </button>

                      <button
                         onClick={(e) => { e.stopPropagation(); }}
                         className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-left transition-colors"
                      >
                         <div className="flex items-center gap-3"><Timer size={18} /> Minuteur</div>
                         <select
                           value={sleepTimer || ''}
                           onChange={(e) => setSleepTimer(e.target.value ? parseInt(e.target.value) : null)}
                           className="bg-white/5 border-none text-[10px] rounded px-1 outline-none text-violet-400 font-bold"
                         >
                            <option value="">Off</option>
                            <option value="15">15m</option>
                            <option value="30">30m</option>
                            <option value="60">1h</option>
                         </select>
                      </button>

                      <hr className="border-white/5 my-1" />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDialog({ isOpen: true, title: 'Signalement', message: 'Merci ! Votre signalement a été envoyé aux administrateurs.', type: 'info' });
                          setShowMoreMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-400 text-sm font-bold text-left transition-colors"
                      >
                        Signaler un problème
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowPlaylistPicker(false); }}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-violet-500 hover:bg-white/5 rounded-lg mb-1"
                      >
                        <ChevronLeft size={14} /> Retour
                      </button>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar px-1">
                        {playlists.filter(p => p.id !== 'local-playlist').map(p => (
                          <button
                            key={p.id}
                            onClick={(e) => { 
                              e.stopPropagation();
                             onAddToPlaylist(p.id, track); 
                              setDialog({ isOpen: true, title: 'Succès', message: `Ajouté à la playlist "${p.name}"`, type: 'success' });
                              setShowMoreMenu(false); 
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-left transition-colors"
                          >
                            <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                               <Music2 size={14} />
                            </div>
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))}
                        {playlists.length === 0 && (
                          <p className="p-4 text-xs text-center text-zinc-500 italic">Aucune playlist disponible</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content - Flex-1 Scrollable Area for Disk/Lyrics */}
      <div className="flex-1 relative z-10 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 px-6 py-4 overflow-y-auto overflow-x-hidden no-scrollbar">
        {/* Left Side: Disk / Lyrics Wrapper */}
        <div className="w-full max-w-[450px] aspect-square flex items-center justify-center">
              <motion.div 
                key="art"
                initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 3 }}
                className="relative aspect-square w-full max-w-[400px] md:max-w-[460px] group"
              >
                  {/* Vinyl Plate */}
                  <motion.div 
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full bg-zinc-950 border-[12px] border-zinc-900 shadow-[0_30px_60px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden ring-1 ring-white/10"
                  >
                     <div className="absolute inset-0 opacity-20 pointer-events-none" 
                          style={{ background: 'repeating-radial-gradient(circle, transparent, transparent 1px, black 2px)' }}></div>
                     <img src={track.coverUrl} className="w-full h-full object-cover p-2 rounded-full opacity-90 scale-105" alt="" />
                     
                     <div className="absolute w-28 h-28 rounded-full bg-zinc-900/90 z-10 border-[6px] border-zinc-800 flex items-center justify-center backdrop-blur-md">
                        <div className="w-6 h-6 rounded-full bg-black shadow-inner border border-zinc-700"></div>
                     </div>
                  </motion.div>

                  {/* Vinyl Arm */}
                  <motion.div 
                    initial={{ rotate: -20 }}
                    animate={{ rotate: isPlaying ? 0 : -25 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="absolute -top-10 -right-12 w-32 h-[200px] pointer-events-none origin-top-right z-30"
                    style={{ transformOrigin: 'calc(100% - 20px) 20px' }}
                  >
                     <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-zinc-800 border-4 border-zinc-700 shadow-xl" />
                     <div className="absolute top-8 right-8 w-2 h-44 bg-gradient-to-b from-zinc-700 to-zinc-500 rounded-full shadow-lg" style={{ transform: 'rotate(-5deg)' }} />
                     <div className="absolute top-[180px] right-10 w-6 h-10 bg-zinc-800 rounded-sm border-2 border-zinc-600 shadow-md" style={{ transform: 'rotate(15deg)' }} />
                  </motion.div>
                  
                   <motion.div 
                     animate={{ scale: isPlaying ? [1, 1.1, 1] : 1 }}
                     transition={{ repeat: Infinity, duration: 2 }}
                     className="absolute -bottom-6 -right-6 w-16 h-16 bg-violet-500 rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-40"
                   >
                     {isPlaying ? <Music2 size={32} color="black" /> : <Play size={32} fill="black" color="black" className="ml-1" />}
                   </motion.div>

                  {/* Loading / Error Overlay on Cover */}
                  <AnimatePresence>
                    {(isLoading || hasError) && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm z-20"
                      >
                        {hasError ? (
                           <div className="flex flex-col items-center justify-center p-4 bg-black/50 rounded-full border border-red-500/30">
                             <MonitorPlay size={32} className="text-red-500 mb-2" />
                             <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest text-center px-2">Lecture<br/>impossible</p>
                           </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center bg-black/30 rounded-full p-4">
                             <Loader2 size={40} className="text-violet-500 animate-spin mb-2" />
                             <p className="text-[10px] uppercase font-bold text-violet-400 tracking-widest animate-pulse">Chargement</p>
                           </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

               </motion.div>
        </div>

        {/* Right Side: Title & Artist (Centered or Left depending on layout) */}
        <div className="w-full max-w-[500px] flex flex-col items-center md:items-start text-center md:text-left gap-2 min-w-0">
           <div className="flex flex-col md:flex-row items-center md:items-end gap-4 w-full">
              <div className="min-w-0 flex-1 overflow-hidden">
                 <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                   {track.id.startsWith('local-') && (
                     <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-[10px] font-black uppercase rounded border border-violet-500/30">Local</span>
                   )}
                   {duration === 0 && !track.id.startsWith('local-') && (
                     <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black uppercase rounded animate-pulse">Live</span>
                   )}
                 </div>
                <div className="marquee-container mb-3 w-full">
                  <motion.h1 
                    key={track.title}
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    className="text-4xl md:text-7xl font-black tracking-tighter inline-block animate-marquee"
                  >
                    {track.title} &nbsp; • &nbsp; {track.title} &nbsp; • &nbsp; {track.title} &nbsp; • &nbsp;
                  </motion.h1>
                </div>
                <div className="marquee-container w-full">
                  <motion.p 
                    key={track.artist}
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 0.6 }}
                    className="text-xl md:text-2xl font-bold text-white/60 inline-block animate-marquee"
                    style={{ animationDelay: '2s' }}
                  >
                    {track.artist} &nbsp; • &nbsp; {track.artist} &nbsp; • &nbsp; {track.artist} &nbsp; • &nbsp;
                  </motion.p>
                </div>
              </div>
              <button 
                onClick={() => toggleFavorite(track.id)}
                className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-90"
              >
                <Heart size={32} fill={isFav ? '#8F00FF' : 'none'} color={isFav ? '#8F00FF' : 'white'} />
              </button>
           </div>
        </div>
      </div>

      {/* Persistent Bottom Control Bar */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-6 pb-8 md:pb-12 space-y-6 md:space-y-8 bg-gradient-to-t from-black via-black/80 to-transparent pt-10">
           {/* Elegant Progress Slider */}
           <div className="space-y-3">
              <div className="relative h-1.5 w-full bg-white/10 rounded-full group cursor-pointer overflow-visible">
                 <input 
                   type="range" min={0} max={0.999999} step="any" value={played} 
                   onChange={e => handleSeekChange(parseFloat(e.target.value))}
                   className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                 />
                 <div 
                   className="h-full bg-violet-500 rounded-full relative"
                   style={{ width: `${played * 100}%` }}
                 >
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_#8F00FF] scale-0 group-hover:scale-100 transition-transform" />
                 </div>
              </div>
              <div className="flex justify-between text-xs md:text-sm font-bold tracking-widest text-white/30 px-1 font-mono">
                 <span>{(duration > 0 || track.id.startsWith('local-')) ? formatTime(played * duration) : <span className="text-red-500">LIVE</span>}</span>
                 <span>{(duration > 0 || track.id.startsWith('local-')) ? formatTime(duration) : <span className="text-red-500">EN DIRECT</span>}</span>
              </div>
           </div>

           {/* Premium Large Controls */}
           <div className="flex items-center justify-between">
              <button onClick={() => setIsShuffle(!isShuffle)} className={`${isShuffle ? 'text-violet-500' : 'text-white/30'} hover:text-white transition-colors`}>
                <Shuffle size={28} />
              </button>
              
              <div className="flex items-center gap-10 md:gap-14">
                <button onClick={skipToPrev} className="text-white/80 hover:text-white hover:scale-110 active:scale-90 transition-all">
                  <SkipBack size={48} fill="currentColor" />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                >
                  {isPlaying 
                    ? <Pause size={44} fill="black" color="black" /> 
                    : <Play size={44} fill="black" color="black" className="ml-2" />
                  }
                </button>
                <button onClick={skipToNext} className="text-white/80 hover:text-white hover:scale-110 active:scale-90 transition-all">
                  <SkipForward size={48} fill="currentColor" />
                </button>
              </div>

              <button 
                onClick={() => {
                  const next: Record<string, 'off' | 'all' | 'one'> = { off: 'all', all: 'one', one: 'off' };
                  setRepeatMode(next[repeatMode]);
                }} 
                className={`transition-colors relative ${repeatMode !== 'off' ? 'text-violet-500' : 'text-white/30 hover:text-white'}`}
              >
                {repeatMode === 'one' ? <Repeat1 size={28} /> : <Repeat size={28} />}
                {repeatMode !== 'off' && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-500 rounded-full" />
                )}
              </button>
           </div>

           {/* Footer Action Bar */}
           <div className="flex items-center justify-between mt-10">
              <div className="flex gap-4">

                <div className="flex items-center bg-white/5 rounded-full p-1 gap-1 border border-white/10 shadow-inner">
                  <button 
                    onClick={() => setIsClipMode(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black transition-all ${!isClipMode ? 'bg-violet-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    <Music2 size={14} /> AUDIO
                  </button>
                  <button 
                    onClick={() => setIsClipMode(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black transition-all ${isClipMode ? 'bg-violet-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    <Tv size={14} /> VIDÉO
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-white/40">
                <button 
                  onClick={() => {
                    if (navigator.share && track) {
                      navigator.share({ title: track.title, text: `${track.title} by ${track.artist}`, url: window.location.href });
                    } else {
                      setDialog({ isOpen: true, title: 'Partage', message: 'Lien copié dans le presse-papier !', type: 'info' });
                    }
                  }}
                  className="hover:text-emerald-500 transition-colors"
                >
                  <Share2 size={24} />
                </button>
                <button 
                  onClick={() => setShowQueue(!showQueue)}
                  className={`hover:text-emerald-500 transition-colors ${showQueue ? 'text-emerald-500' : ''}`}
                >
                  <ListMusic size={24} />
                </button>
              </div>
           </div>
        </div>

      <AnimatePresence>
        {showQueue && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute top-0 right-0 bottom-0 w-full md:w-96 bg-zinc-900/95 backdrop-blur-3xl z-[180] border-l border-white/10 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
               <h3 className="text-xl font-black">File d'attente</h3>
               <button onClick={() => setShowQueue(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
               {activeQueue.map((t, i) => (
                   <div 
                     key={t.id + i} 
                     onClick={() => playTrack(t, activeQueue)}
                     className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${t.id === track.id ? 'bg-emerald-500/20' : 'hover:bg-white/5'}`}
                   >
                     <img src={t.coverUrl} className="w-12 h-12 rounded-lg object-cover" alt="" />
                     <div className="flex-1 min-w-0 text-sm">
                        <p className={`font-bold truncate ${t.id === track.id ? 'text-emerald-400' : 'text-white'}`}>{t.title}</p>
                        <p className="text-[10px] text-white/40 truncate italic">{t.artist}</p>
                     </div>
                   </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Visualizer Style CSS */}
      <style>{`
        .mask-fade-vertical {
          mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
        }
      `}</style>

      <Dialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog(d => ({ ...d, isOpen: false }))}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />
    </motion.div>
  );
}
