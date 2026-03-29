import React from 'react';
import { motion } from 'framer-motion';
import { Smile, Zap, Heart as HeartIcon, Dumbbell, Play, History, TrendingUp, Radio, Music, Moon, Flame, ChevronLeft, Upload } from 'lucide-react';
import { Track } from '../types';
import { INITIAL_TRACKS } from '../data/initialTracks';
import { TrackCard } from '../components/ui/TrackCard';
import clsx from 'clsx';

interface HomeViewProps {
  currentTrack: Track | null;
  playTrack: (t: Track, queue?: Track[]) => void;
  handleMoodClick: (mood: string) => void;
  isMoodLoading: boolean;
  recentlyPlayed: Track[];
  liveTracks: Track[];
  recommendations?: Track[];
  isRecommendationsLoading?: boolean;
  localTracks?: Track[];
  onImportClick?: (files: FileList | File[]) => void;
}

export function HomeView({ 
  currentTrack, playTrack, handleMoodClick, 
  isMoodLoading, recentlyPlayed, liveTracks,
  recommendations = [], isRecommendationsLoading = false,
  localTracks = [], onImportClick
}: HomeViewProps) {
  const [showAllRecent, setShowAllRecent] = React.useState(false);
  const displayedRecent = showAllRecent ? recentlyPlayed : recentlyPlayed?.slice(0, 6);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="py-6 space-y-16">
      <input 
        type="file" ref={fileInputRef} hidden multiple accept="audio/*" 
        onChange={(e) => e.target.files && onImportClick?.(e.target.files)} 
      />

      {/* ── Hero Section Premium ── */}
      <section className="relative h-[300px] md:h-[400px] rounded-[40px] overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-900/40 via-black/60 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2070&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[3s]" 
          alt="Hero"
        />
        <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-16 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <span className="px-4 py-1.5 bg-violet-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-[0_0_20px_rgba(143,0,255,0.4)]">
              À ne pas manquer
            </span>
            <h1 className="text-4xl md:text-7xl font-black text-white leading-none tracking-tighter">
              Découvre tes <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">
                prochains favoris
              </span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 max-w-md text-sm md:text-base font-medium leading-relaxed"
          >
            Explore des millions de titres, des mix personnalisés et recharge ta bibliothèque locale en un clic.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4"
          >
            <button 
              onClick={() => INITIAL_TRACKS[0] && playTrack(INITIAL_TRACKS[0], INITIAL_TRACKS)}
              className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-all shadow-xl flex items-center gap-2"
            >
              <Play size={16} fill="black" /> Écouter maintenant
            </button>
          </motion.div>
        </div>
      </section>

      <div className="space-y-16">
        
        {/* 1. Récemment écouté (Horizontal) */}
        {recentlyPlayed?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <History size={24} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                  Tes dernières écoutes
                </h2>
              </div>
              {recentlyPlayed.length > 5 && (
                <button 
                  onClick={() => setShowAllRecent(!showAllRecent)}
                  className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/5 shadow-inner"
                >
                  {showAllRecent ? 'Réduire' : `Tout voir (${recentlyPlayed.length})`}
                  <ChevronLeft size={14} className={clsx("transition-transform duration-300", !showAllRecent ? "-rotate-90" : "rotate-90")} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedRecent.map((track, idx) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group flex items-center h-[88px] p-3 rounded-2xl overflow-hidden transition-all cursor-pointer hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] border border-white/5 hover:border-violet-500/30 backdrop-blur-md relative"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                  onClick={() => playTrack(track, recentlyPlayed)}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(143,0,255,0.08)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative flex-shrink-0">
                    <img src={track.coverUrl} alt={track.title} className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-500" />
                    {currentTrack?.id === track.id && (
                      <div className="absolute inset-0 bg-violet-600/40 rounded-xl flex items-center justify-center backdrop-blur-[1.5px]">
                        <div className="flex gap-1 items-end h-4">
                          <div className="w-1 h-2 bg-white rounded-full animate-[bar-grow_1s_infinite]" />
                          <div className="w-1 h-3 bg-white rounded-full animate-[bar-grow_1.2s_infinite]" />
                          <div className="w-1 h-1.5 bg-white rounded-full animate-[bar-grow_0.8s_infinite]" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 px-4 min-w-0">
                    <p className="font-bold truncate text-sm md:text-base mb-0.5 group-hover:text-violet-400 transition-colors" style={{ color: currentTrack?.id === track.id ? '#A855F7' : 'white' }}>
                      {track.title}
                    </p>
                    <p className="text-xs text-white/40 truncate font-medium uppercase tracking-wider">{track.artist}</p>
                  </div>
                  <button className="mr-2 w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 flex-shrink-0 transform translate-x-4 group-hover:translate-x-0">
                    <Play size={18} fill="white" className="ml-0.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* 2. Musique Locale (avec état vide) */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
              <Music size={24} className="text-violet-500" />
            </div>
            <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Ma Musique Locale
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {localTracks.length === 0 ? (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-all shadow-inner">
                  <Upload size={32} />
                </div>
                <div className="text-center px-4">
                  <p className="font-bold text-sm">Ajouter des fichiers</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Importer vos MP3</p>
                </div>
              </motion.div>
            ) : (
              localTracks.slice(0, 12).map(track => (
                <TrackCard 
                  key={track.id} 
                  track={track} 
                  onPlay={() => playTrack(track, localTracks)} 
                  isActive={currentTrack?.id === track.id} 
                />
              ))
            )}
          </div>
        </motion.section>

        {/* 3. Recommandations */}
        {(isRecommendationsLoading || recommendations.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <Zap size={24} className="text-sky-500" />
              </div>
              <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                ✨ Recommandés pour toi
              </h2>
            </div>

            {isRecommendationsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--bg-card)' }}>
                    <div className="w-full aspect-square bg-white/5" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-white/10 rounded w-3/4" />
                      <div className="h-2 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {recommendations.map(track => (
                  <TrackCard key={track.id} track={track} onPlay={() => playTrack(track, recommendations)} isActive={currentTrack?.id === track.id} />
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* 4. Tendances */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <TrendingUp size={24} className="text-orange-500" />
            </div>
            <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Tendances & Classiques
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {INITIAL_TRACKS.map(track => (
              <TrackCard key={track.id} track={track} onPlay={() => playTrack(track, INITIAL_TRACKS)} isActive={currentTrack?.id === track.id} />
            ))}
          </div>
        </motion.section>
        
        {/* 5. Live */}
        {liveTracks?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Radio size={24} className="text-red-500 animate-pulse" />
                En Direct / Live
              </h2>
              <span className="text-xs font-black px-2 py-1 bg-red-500 text-white rounded-full uppercase tracking-tighter animate-pulse">Live</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {liveTracks.map(track => (
                <TrackCard 
                  key={track.id} 
                  track={track} 
                  onPlay={() => playTrack(track, liveTracks)} 
                  isActive={currentTrack?.id === track.id} 
                />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
