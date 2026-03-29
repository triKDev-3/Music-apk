/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo, useRef, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, AlertCircle, Play, Maximize2, X } from 'lucide-react';
import { clsx } from 'clsx';
import ReactPlayer from 'react-player';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

import { usePlayerState } from './hooks/usePlayerState';
import { useAuth }        from './hooks/useAuth';
import { Sidebar }        from './components/Sidebar';
import { Header }         from './components/Header';
import { PlayerBar }      from './components/PlayerBar';
import { HomeView }       from './views/HomeView';
import { SearchView }     from './views/SearchView';
import { LibraryView }    from './views/LibraryView';
import { NowPlayingView } from './views/NowPlayingView';
import { PlaylistView }   from './views/PlaylistView';
import { AIStudioView }   from './views/AIStudioView';
import { ClipPlayerView } from './components/ClipPlayerView';
import { RecognitionModal } from './components/RecognitionModal';
import { Dialog }         from './components/ui/Dialog';
import { PermissionBanner } from './components/PermissionBanner';

import { searchMusic, getMoodPlaylists } from './services/geminiService';
import { searchYouTube, searchLiveMusic } from './services/youtubeService';
import { setYouTubeOAuthToken } from './services/youtubeService';
import { saveLocalTrack, getAllLocalTracks } from './services/localDbService';
import { GoogleAuthProvider } from 'firebase/auth';
import { Track, Playlist, View, Theme }  from './types';
import { INITIAL_TRACKS } from './data/initialTracks';

const Player = React.forwardRef<any, any>((props, ref) => {
  const { onDuration, onBuffer, onBufferEnd, ...rest } = props;
  const RP = ReactPlayer as any;
  return (
    <RP
      ref={ref}
      {...rest}
      onDuration={onDuration}
      onBuffer={onBuffer}
      onBufferEnd={onBufferEnd}
    />
  );
});
Player.displayName = 'Player';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Une erreur inattendue s'est produite.";
      try {
        if (this.state.error?.message) {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error) {
            errorMessage = `Erreur Firestore (${parsedError.operationType}) : ${parsedError.error}`;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full min-h-screen space-y-4 p-8 text-center bg-black">
          <div className="p-4 bg-red-500/10 rounded-full">
            <X size={48} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white">Oops ! Quelque chose a mal tourné.</h2>
          <p className="text-white/40 max-w-md">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-700 transition-colors"
          >
            Recharger l'application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [theme, setTheme]             = useState<Theme>('dark');
  const [currentView, setCurrentView] = useState<View>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMoodLoading, setIsMoodLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [isScanning, setIsScanning]   = useState(false);
  const [hasStarted, setHasStarted]   = useState(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isRecognitionOpen, setIsRecognitionOpen]   = useState(false);
  const [isPipActive, setIsPipActive]                 = useState(false);
  const [videoFilters, setVideoFilters] = useState({ brightness: 1, saturation: 1 });
  const [dialog, setDialog] = useState<{
    isOpen: boolean, title: string, message: string, 
    type?: 'info' | 'error' | 'success' | 'confirm' | 'prompt',
    onConfirm?: (v?: string) => void,
    defaultValue?: string
  }>({
    isOpen: false, title: '', message: ''
  });
  const [liveTracks, setLiveTracks] = useState<Track[]>([]);
  const [homeRecommendations, setHomeRecommendations] = useState<Track[]>([]);
  const [isHomeLoading, setIsHomeLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'date'>(() => {
    return (localStorage.getItem('playme_sortby') as any) || 'date';
  });

  const fileInputRef   = useRef<HTMLInputElement>(null);

  // ── Historique de recherche (pour les recommandations personnalisées) ─────────
  const trackSearchHistory = (query: string) => {
    try {
      const history: string[] = JSON.parse(localStorage.getItem('playme_search_history') || '[]');
      const q = query.trim().toLowerCase();
      if (!q || history.includes(q)) return;
      history.unshift(q);
      localStorage.setItem('playme_search_history', JSON.stringify(history.slice(0, 20)));
    } catch {}
  };

  const getSearchHistory = (): string[] => {
    try { return JSON.parse(localStorage.getItem('playme_search_history') || '[]'); }
    catch { return []; }
  };

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('playme_playlists');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [
        { id: 'p1', name: 'Mes favoris',       description: 'Mes titres préférés', tracks: [] },
        { id: 'p2', name: 'Ambiance détendue', description: 'Pour se relaxer',     tracks: [] },
      ];
    } catch { 
      return [
        { id: 'p1', name: 'Mes favoris',       description: 'Mes titres préférés', tracks: [] },
        { id: 'p2', name: 'Ambiance détendue', description: 'Pour se relaxer',     tracks: [] },
      ];
    }
  });

  const { user, loading: authLoading } = useAuth();
  const player = usePlayerState({ searchResults, user });

  // ── Initialisation Google Auth (Capacitor) ──────────────────────────────
  useEffect(() => {
    // Si on est sur le Web, on initialise GoogleAuth avec l'ID client de Firebase
    if (!Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '742584976934-0nmes6v5qfv9vfhiqgvdcoa9qls9h86i.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  }, []);


  // ── Chargement Initial (Firestore ou LocalStorage) ──────────────────────────
  useEffect(() => {
    setIsScanning(true);
    if (user?.uid) {
      import('./services/dbService').then(({ loadUserData }) => {
        loadUserData(user.uid).then(data => {
          if (data?.playlists) setPlaylists(data.playlists);
          // Local tracks metadata from cloud, but we prefer IndexedDB for actual files
          getAllLocalTracks().then(dbTracks => {
            if (dbTracks.length > 0) setLocalTracks(dbTracks);
            else if (data?.localTracks) setLocalTracks(data.localTracks);
            setIsScanning(false);
          });
        });
      });
    } else {
      getAllLocalTracks().then(dbTracks => {
        if (dbTracks.length > 0) setLocalTracks(dbTracks);
        const savedP = localStorage.getItem('playme_playlists');
        if (savedP) setPlaylists(JSON.parse(savedP));
        setIsScanning(false);
      });
    }
  }, [user?.uid]);

  useEffect(() => {
    // Repair durations for local tracks that are 0
    const repairDurations = async () => {
      const tracksToRepair = localTracks.filter(t => t.id.startsWith('local-') && t.duration === 0);
      if (tracksToRepair.length === 0) return;

      const dbTracks = await getAllLocalTracks();
      const newLocalTracks = [...localTracks];
      let changed = false;

      for (const track of tracksToRepair) {
        const dbTrack = dbTracks.find(t => t.id === track.id);
        if (dbTrack && dbTrack.fileBlob) {
           const duration: number = await new Promise((resolve) => {
             const audio = new Audio();
             audio.src = URL.createObjectURL(dbTrack.fileBlob);
             audio.onloadedmetadata = () => {
                resolve(audio.duration);
                URL.revokeObjectURL(audio.src);
             };
             audio.onerror = () => {
                resolve(0);
                URL.revokeObjectURL(audio.src);
             };
           });
           
           if (duration > 0) {
              const idx = newLocalTracks.findIndex(t => t.id === track.id);
              if (idx !== -1) {
                newLocalTracks[idx] = { ...newLocalTracks[idx], duration };
                // Also update DB
                await saveLocalTrack(newLocalTracks[idx], dbTrack.fileBlob as File);
                changed = true;
              }
           }
        }
      }

      if (changed) {
        setLocalTracks(newLocalTracks);
      }
    };

    if (localTracks.length > 0) repairDurations();
  }, [localTracks.length]);

  // ── Persistence playlists & theme ─────────────────────────────────────────────
  useEffect(() => {
    if (user?.uid) {
      // Strip Blobs from localTracks before saving to Firestore to avoid "Unsupported field value: a custom File object" error
      const serializableLocalTracks = localTracks.map(t => {
        const { fileBlob, ...rest } = t as any;
        return rest;
      });
      // Strip Blobs from tracks inside playlists as well
      const serializablePlaylists = playlists.map(p => ({
        ...p,
        tracks: p.tracks.map(t => {
          const { fileBlob, ...rest } = t as any;
          return rest;
        })
      }));

      import('./services/dbService').then(({ saveUserData }) => {
        saveUserData(user.uid, { playlists: serializablePlaylists, localTracks: serializableLocalTracks });
      });
    } else {
      localStorage.setItem('playme_playlists', JSON.stringify(playlists));
      localStorage.setItem('playme_localtracks', JSON.stringify(localTracks));
    }
  }, [playlists, localTracks, user?.uid]);

  useEffect(() => {
    localStorage.setItem('playme_sortby', sortBy);
  }, [sortBy]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  // ── Restaurer le token OAuth YouTube au rechargement ─────────────────────
  useEffect(() => {
    if (!user) return;
    // Tente de récupérer le token OAuth depuis la session Firebase en cours
    import('firebase/auth').then(({ getAuth }) => {
      const auth = getAuth();
      auth.currentUser?.getIdTokenResult().catch(() => {});
      // Utilise le provider Google pour tenter de re-récupérer le credential
      // Note: le token OAuth n'est disponible qu'après signInWithPopup, pas au reload
      // On log juste pour informer
      console.log('[Auth] Utilisateur restauré au reload:', user.displayName, '| Token YouTube: non disponible (reconnexion nécessaire)');
    });
  }, [user?.uid]);

  // ── Recommandations personnalisées basées sur l'historique ────────────────
  useEffect(() => {
    const loadPersonalizedRecs = async () => {
      const history = getSearchHistory();
      if (history.length === 0) return; // Rien à personnaliser encore

      setIsHomeLoading(true);
      try {
        // Prend les 3 termes les plus récents
        const topQueries = history.slice(0, 3);
        const prompt = topQueries.join(', ');
        const tracks = await searchYouTube(prompt);
        if (tracks.length > 0) {
          setHomeRecommendations(tracks.slice(0, 10));
        } else {
          // Fallback Gemini
          const gt = await searchMusic(`musiques similaires à ${prompt}`);
          setHomeRecommendations(gt.slice(0, 10));
        }
      } catch (e) {
        console.warn('[Home] Reco load failed:', e);
      } finally {
        setIsHomeLoading(false);
      }
    };
    loadPersonalizedRecs();
  }, []);

  // ── Fetch Live Music on Mount ──────────────────────────────────────────────
  useEffect(() => {
    searchLiveMusic().then(tracks => {
      setLiveTracks(tracks);
    });
  }, []);

  // ── Recherche ─────────────────────────────────────────────────────────────
  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setCurrentView('search');
    trackSearchHistory(query);
    try {
      const { searchSpotify } = await import('./services/spotifyService');
      const [spotifyResults, ytResults] = await Promise.all([
        searchSpotify(query).catch(() => []),
        searchYouTube(query).catch(() => [])
      ]);

      let combined = [...spotifyResults];
      ytResults.forEach(yt => {
        const alreadyFound = spotifyResults.some(s => 
          s.title.toLowerCase().includes(yt.title.toLowerCase()) || 
          yt.title.toLowerCase().includes(s.title.toLowerCase())
        );
        if (!alreadyFound) combined.push(yt);
      });

      if (combined.length > 0) {
        setSearchResults(combined);
      } else {
        const geminiResults = await searchMusic(query);
        setSearchResults(geminiResults);
      }
    } catch (err) {
      console.error('[Search] Error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      performSearch(q);
    }
  }, []);

  // ── Gestionnaire Importation Locale ─────────────────────────────────────────
  const processFiles = async (files: FileList | File[]) => {
    const newTracks: Track[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith('audio/')) {
        const trackId = `local-${Math.random().toString(36).substr(2, 9)}`;
        
        // Extract duration
        const duration: number = await new Promise((resolve) => {
          const audio = new Audio();
          audio.src = URL.createObjectURL(file);
          audio.onloadedmetadata = () => {
             resolve(audio.duration);
             URL.revokeObjectURL(audio.src);
          };
          audio.onerror = () => {
             resolve(0);
             URL.revokeObjectURL(audio.src);
          };
        });

        const track: Track = {
          id: trackId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: 'Fichier local',
          album: 'Ma Musique',
          coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
          duration: duration,
          youtubeId: 'local-blob',
        };
        await saveLocalTrack(track, file);
        newTracks.push(track);
      }
    }
    if (newTracks.length > 0) {
      setLocalTracks(prev => [...prev, ...newTracks]);
      setDialog({ 
        isOpen: true, 
        title: 'Importation Réussie', 
        message: `${newTracks.length} morceaux ont été ajoutés à votre bibliothèque locale.`, 
        type: 'success' 
      });
    }
  };

  const handleLocalMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  // Auto-start une fois le scan fini
  useEffect(() => {
    if (!isScanning && !hasStarted) {
      const timer = setTimeout(() => setHasStarted(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isScanning, hasStarted]);


  const handleStartExperience = () => {
    setHasStarted(true);
    if (localTracks.length === 0) {
      fileInputRef.current?.click();
    }
  };

  const handleRecognitionResult = async (track: Track) => {
    // 1. Lancer la lecture immédiatement avec les métadonnées de base
    // Le hook usePlayerState se chargera de trouver un ID YouTube en arrière-plan pour l'audio
    player.playTrack(track);
    setIsNowPlayingOpen(true);

    // 2. Rechercher un clip officiel en arrière-plan pour enrichir l'expérience si l'utilisateur bascule en mode Clip
    try {
      const query = `${track.artist} ${track.title} official video clip`;
      const ytResults = await searchYouTube(query);
      
      if (ytResults && ytResults.length > 0) {
        const topResult = ytResults[0];
        // Si on demande de jouer le même morceau, on redémarre le morceau au début
        if (player.currentTrack?.id === track.id) {
          if (player.isClipMode && player.reactPlayerRef.current) {
            player.reactPlayerRef.current.seekTo(0);
          } else if (!player.isClipMode && player.audioRef.current) {
            player.audioRef.current.currentTime = 0;
            if (player.localUrl) player.audioRef.current.play().catch(() => {});
          }
          player.setIsPlaying(true);
          return;
        }
        // On met à jour le morceau en cours si c'est toujours le même
        if (player.currentTrack?.id === track.id) {
          player.playTrack({
            ...track,
            youtubeId: topResult.youtubeId,
            coverUrl: topResult.coverUrl,
            duration: topResult.duration,
            album: topResult.album || track.album,
            artist: topResult.artist || track.artist
          });
        }
      }
    } catch (err) {
      console.error('[Shazam] Erreur recherche clip en arrière-plan:', err);
    }
  };


  const handleMoodClick = async (mood: string) => {
    setIsMoodLoading(true);
    setCurrentView('search');
    try {
      const results = await getMoodPlaylists(mood);
      setSearchResults(results);
    } catch (err) { console.error('Mood search failed', err); }
    finally { setIsMoodLoading(false); }
  };

  const addTrackToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      if (p.tracks.find(t => t.id === track.id)) return p;
      return { ...p, tracks: [...p.tracks, track] };
    }));
  };

  const deletePlaylist = (id: string) => {
    if (id === 'p1' || id === 'local-playlist') return; // Protect system playlists
    setPlaylists(prev => prev.filter(p => p.id !== id));
    setCurrentView('home');
  };

  const renamePlaylist = (id: string, newName: string) => {
    setPlaylists(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
    }));
  };

  // ── Pistes récentes ───────────────────────────────────────────────────────
  const recentlyPlayedTracks = useMemo(() => {
    try {
      const ids = player.stats.recentlyPlayed || [];
      const all = [...INITIAL_TRACKS, ...searchResults, ...localTracks];
      return ids.map(id => all.find(t => t.id === id)).filter((t): t is Track => !!t);
    } catch { return []; }
  }, [player.stats.recentlyPlayed, searchResults, localTracks]);

  // ── Synchronisation des favoris avec la playlist 'Mes favoris' ────────────────
  useEffect(() => {
    setPlaylists(prev => {
      const all = [...INITIAL_TRACKS, ...searchResults, ...localTracks];
      const favTracks = player.favorites
        .map(id => all.find(t => t.id === id))
        .filter((t): t is Track => !!t);

      // Si p1 n'existe pas, on le crée (normalement il existe)
      const p1Idx = prev.findIndex(p => p.id === 'p1');
      if (p1Idx === -1) {
        return [{ id: 'p1', name: 'Titres likés', description: 'Mes titres préférés', tracks: favTracks }, ...prev];
      }
      
      return prev.map(p => {
        if (p.id === 'p1') return { ...p, tracks: favTracks };
        return p;
      });
    });
  }, [player.favorites, localTracks, searchResults]);

  // ── Playlist automatique pour Musique Locale ────────────────────────────────
  useEffect(() => {
    if (localTracks.length > 0) {
      setPlaylists(prev => {
        const exists = prev.find(p => p.id === 'local-playlist');
        if (!exists) {
          return [...prev, { 
            id: 'local-playlist', 
            name: 'Musique locale', 
            description: 'Vos fichiers importés', 
            tracks: localTracks 
          }];
        }
        return prev.map(p => p.id === 'local-playlist' ? { ...p, tracks: localTracks } : p);
      });
    }
  }, [localTracks]);

  // ── Arrière-plan ──────────────────────────────────────────────────────────
  const mainBg = 'var(--bg-base)';

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <div className="relative flex h-[100dvh] w-screen overflow-hidden font-sans bg-[var(--bg-base)] text-[var(--text-primary)]">

        {/* ── Nouveau Loader Premium (Remplace le Splash Screen bloquant) ── */}
        <AnimatePresence>
          {!hasStarted && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black"
            >
              <div className="relative flex flex-col items-center">
                {/* Logo avec halo pulsant */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8] 
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-400 via-emerald-400 to-cyan-400 tracking-tighter">
                    Play-Me
                  </h1>
                </motion.div>
                
                {/* Halo de fond */}
                <div className="absolute inset-0 blur-[60px] bg-violet-600/20 rounded-full scale-150 animate-pulse" />

                {/* Barre de chargement minimaliste */}
                <div className="mt-12 w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ left: "-100%" }}
                    animate={{ left: "100%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-violet-500 to-transparent"
                  />
                </div>
                
                <p className="mt-4 text-[10px] uppercase font-black tracking-[0.3em] text-white/30 animate-pulse">
                  Initialisation
                </p>
              </div>

              {/* Petit bouton discret au cas où l'autoplay bloque vraiment (Mobile) */}
              <button 
                onClick={handleStartExperience}
                className="absolute bottom-10 text-[10px] text-white/10 hover:text-white/40 transition-colors uppercase font-bold tracking-widest"
              >
                Passer le chargement
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Lecteur Audio Principal (Direct YouTube) ── */}
        {player.youtubeId && hasStarted && !player.isClipMode && (
          <div 
            style={{ 
              position: 'fixed', 
              bottom: '100px', 
              right: '24px', 
              zIndex: 200,
              display: (player.isPlaying && isPipActive && !isNowPlayingOpen) ? 'block' : 'none',
              opacity: 0.95,
              pointerEvents: 'auto',
              cursor: 'pointer'
            }}
            className="group/pip"
          >
            {/* Close Button for PIP */}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsPipActive(false); }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center z-[210] opacity-0 group-hover/pip:opacity-100 transition-opacity shadow-lg focus:outline-none"
            >
              <X size={12} />
            </button>

            <div 
              onClick={() => {
                setIsNowPlayingOpen(true);
                setIsPipActive(false);
              }}
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <img
                src={player.currentTrack?.coverUrl || `https://i.ytimg.com/vi/${player.youtubeId}/hqdefault.jpg`}
                alt="Miniplayer cover"
                style={{ width: '200px', height: '112px', objectFit: 'cover' }}
              />
            </div>
            
            {/* Hint overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/pip:opacity-100 transition-opacity flex items-center justify-center rounded-[16px] pointer-events-none">
               <Maximize2 size={24} className="text-white drop-shadow-lg" />
            </div>
          </div>
        )}

        {/* ── Lecteur YouTube Unifié (Audio & Clip) ── */}
        <div
          className={clsx(
            'transition-all duration-700 ease-in-out overflow-hidden',
            player.isClipMode
              ? (isPipActive ? 'fixed bottom-[100px] right-[24px] w-[200px] h-[112px] z-[200] rounded-2xl shadow-2xl border border-white/10 cursor-pointer group/clippip' : 'absolute inset-0 z-[180] pointer-events-auto bg-black')
              : 'fixed top-0 left-0 w-1 h-1 opacity-[0.01] pointer-events-none z-[-100]', // Lecteur actif mais invisible derrière le fond (crucial pour le background Android)
          )}
          onClick={isPipActive ? () => setIsPipActive(false) : undefined}
        >
          {isPipActive && (
             <button 
               onClick={(e) => { e.stopPropagation(); setIsPipActive(false); player.setIsClipMode(false); }}
               className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center z-[210] shadow-lg"
             >
               <X size={12} />
             </button>
          )}
        {player.youtubeId && hasStarted && (
          <Player
            key={`clip-${player.youtubeId}`}
            ref={player.reactPlayerRef}
            url={`https://www.youtube.com/watch?v=${player.youtubeId}`}
            playing={player.isPlaying && (player.isClipMode || (player.currentTrack && !player.currentTrack.id.startsWith('local-')))}
            controls={true}
            volume={player.isMuted ? 0 : player.volume}
            muted={false}
            playbackRate={player.playbackRate}
            loop={player.repeatMode === 'one'}
            progressInterval={500}
            config={{
              youtube: {
                rel: 0,
                origin: window.location.origin,
                playerVars: {
                  autoplay: 1,
                  modestbranding: 1,
                  iv_load_policy: 3
                }
              }
            }}
            onReady={() => {
              console.log('[ReactPlayer] Ready:', player.youtubeId);
              player.handleReady();
            }}
            onStart={() => {
              console.log('[ReactPlayer] Started:', player.youtubeId);
              player.setIsLoading(false);
            }}
            onPlay={() => {
              console.log('[ReactPlayer] Play Event');
              player.setIsLoading(false);
            }}
            onBuffer={() => player.setIsLoading(true)}
            onBufferEnd={() => player.setIsLoading(false)}
            onProgress={player.handleTimeUpdate}
            onDuration={player.handleDurationChange}
            onEnded={player.handleEnded}
            onError={(e: any) => {
              console.error('[ReactPlayer] Error for ID:', player.youtubeId, e);
              player.handleError(e);
            }}
            width="100%"
            height="100%"
            playsinline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
              pointerEvents: 'auto',
              opacity: 1,
              filter: `brightness(${videoFilters.brightness}) saturate(${videoFilters.saturation})`
            }}
          />
        )}

          {/* Overlay Clip Mode */}
          <AnimatePresence>
            {player.isClipMode && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 z-[65]"
              >
                <ClipPlayerView 
                  track={player.currentTrack}
                  isPlaying={player.isPlaying}
                  setIsPlaying={player.setIsPlaying}
                  played={player.played}
                  duration={player.duration}
                  onSeek={player.handleSeekChange}
                  onSkipNext={() => player.skipToNext()}
                  onSkipPrev={() => player.skipToPrev()}
                  onClose={() => { player.setIsClipMode(false); setIsPipActive(false); }}
                  onMinimize={() => setIsPipActive(true)}
                  formatTime={player.formatTime}
                  volume={player.volume}
                  isMuted={player.isMuted}
                  setIsMuted={player.setIsMuted}
                  playbackRate={player.playbackRate}
                  setPlaybackRate={player.setPlaybackRate}
                  isLoading={player.isLoading}
                  hasError={player.hasError}
                  brightness={videoFilters.brightness}
                  saturation={videoFilters.saturation}
                  onFiltersChange={(f) => setVideoFilters(prev => ({ ...prev, ...f }))}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audio HTML5 — fichiers locaux */}
          <audio
            ref={player.audioRef}
            src={player.localUrl || undefined}
            onEnded={() => player.handleEnded()}
            loop={player.repeatMode === 'one'}
            style={{ display: 'none' }}
            preload="auto"
          />
        </div>

        {/* Input caché persistant pour l'importation locale */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleLocalMusicUpload} 
          multiple 
          accept="audio/*"
          // @ts-ignore
          webkitdirectory="true" 
          directory="true"
          className="hidden" 
        />


        {/* ── Vue Plein Écran (Now Playing) ── */}
        <AnimatePresence>
          {isNowPlayingOpen && player.currentTrack && (
            <NowPlayingView
              track={player.currentTrack}
              isPlaying={player.isPlaying}
              setIsPlaying={player.setIsPlaying}
              played={player.played}
              duration={player.duration}
              repeatMode={player.repeatMode}
              setRepeatMode={player.setRepeatMode}
              isShuffle={player.isShuffle}
              setIsShuffle={player.setIsShuffle}
              favorites={player.favorites}
              toggleFavorite={player.toggleFavorite}
              handleSeekChange={player.handleSeekChange}
              formatTime={player.formatTime}
              skipToNext={player.skipToNext}
              skipToPrev={player.skipToPrev}
              onClose={() => { setIsNowPlayingOpen(false); setIsPipActive(false); }}
              onMinimize={() => { setIsNowPlayingOpen(false); setIsPipActive(true); }}
              isClipMode={player.isClipMode}
              setIsClipMode={player.setIsClipMode}
              playlists={playlists}
              onAddToPlaylist={addTrackToPlaylist}
              playbackRate={player.playbackRate}
              setPlaybackRate={player.setPlaybackRate}
              sleepTimer={player.sleepTimer}
              setSleepTimer={player.setSleepTimer}
              activeQueue={player.activeQueue}
              playTrack={player.playTrack}
              isLoading={player.isLoading}
              hasError={player.hasError}
            />
          )}
        </AnimatePresence>

        {/* ── UI principale ── */}
        {!player.isClipMode && (
          <div className="relative z-10 flex flex-col h-full w-full">
            <div className="flex-1 flex overflow-hidden">
              <Sidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
                playlists={playlists}
                createPlaylist={() => {
                  setDialog({
                    isOpen: true,
                    title: 'Nouvelle Playlist',
                    message: 'Entrez le nom de votre nouvelle playlist :',
                    type: 'prompt',
                    defaultValue: `Playlist #${playlists.length + 1}`,
                    onConfirm: (name) => {
                      if (name) setPlaylists(prev => [...prev, { id: Math.random().toString(36), name, description: '', tracks: [] }]);
                    }
                  });
                }}
                 isOpen={isSidebarOpen}
                 onClose={() => setIsSidebarOpen(false)}
                 onPlaylistClick={(id) => {
                   setSelectedPlaylistId(id);
                   setCurrentView('playlist');
                   setIsSidebarOpen(false);
                 }}
              />

              <main className="flex-1 flex flex-col overflow-hidden shadow-2xl" style={{ background: mainBg }}>
                <PermissionBanner />
                <Header
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  handleSearch={handleSearch}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  onMenuOpen={() => setIsSidebarOpen(true)}
                  user={user}
                  authLoading={authLoading}
                  isScanning={isScanning}
                  onRecognitionOpen={() => setIsRecognitionOpen(true)}
                />

                <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-2 scroll-smooth">
                  {currentView === 'home' && (
                    <HomeView
                      currentTrack={player.currentTrack}
                      playTrack={player.playTrack}
                      handleMoodClick={handleMoodClick}
                      isMoodLoading={isMoodLoading}
                      recentlyPlayed={recentlyPlayedTracks}
                      liveTracks={liveTracks}
                      recommendations={homeRecommendations}
                      isRecommendationsLoading={isHomeLoading}
                      localTracks={localTracks}
                      onImportClick={processFiles}
                    />
                  )}
                  {currentView === 'search' && (
                    <SearchView
                      searchResults={searchResults}
                      isSearching={isSearching || isMoodLoading}
                      searchQuery={searchQuery}
                      currentTrack={player.currentTrack}
                      favorites={player.favorites}
                      playTrack={player.playTrack}
                      toggleFavorite={player.toggleFavorite}
                      formatTime={player.formatTime}
                      playlists={playlists}
                      onAddToPlaylist={addTrackToPlaylist}
                    />
                  )}
                  {currentView === 'library' && (
                    <LibraryView
                      favorites={player.favorites}
                      playlists={playlists}
                      stats={player.stats}
                      localTracks={localTracks}
                      onImportFiles={processFiles}
                      playTrack={player.playTrack}
                      onPlaylistClick={(id) => {
                         setSelectedPlaylistId(id);
                         setCurrentView('playlist');
                       }}
                       formatTime={player.formatTime}
                       sortBy={sortBy}
                       onSortChange={setSortBy}
                     />
                  )}
                  {currentView === 'playlist' && (
                    <PlaylistView
                      playlist={playlists.find(p => p.id === selectedPlaylistId) || null}
                      playTrack={player.playTrack}
                      currentTrackId={player.currentTrack?.id}
                      formatTime={player.formatTime}
                      onDeletePlaylist={deletePlaylist}
                      onRenamePlaylist={renamePlaylist}
                      onRemoveTrack={removeTrackFromPlaylist}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                    />
                  )}
                  {currentView === 'ai-studio' && (
                    <AIStudioView onPlayTrack={player.playTrack} />
                  )}
                </div>
              </main>
            </div>

            <PlayerBar
              currentTrack={player.currentTrack}
              isPlaying={player.isPlaying}     setIsPlaying={player.setIsPlaying}
              isMuted={player.isMuted}         setIsMuted={player.setIsMuted}
              volume={player.volume}           setVolume={player.setVolume}
              played={player.played}           duration={player.duration}
              repeatMode={player.repeatMode}   setRepeatMode={player.setRepeatMode}
              isShuffle={player.isShuffle}     setIsShuffle={player.setIsShuffle}
              isClipMode={player.isClipMode}   setIsClipMode={player.setIsClipMode}
              favorites={player.favorites}
              toggleFavorite={player.toggleFavorite}
              handleSeekChange={player.handleSeekChange}
              formatTime={player.formatTime}
              skipToNext={player.skipToNext}
              skipToPrev={player.skipToPrev}
              onOpenNowPlaying={() => setIsNowPlayingOpen(true)}
              isLoading={player.isLoading}
            />
          </div>
         )}

      </div>
      
      <Dialog 
        {...dialog} 
        onClose={() => setDialog(d => ({ ...d, isOpen: false }))} 
      />
      <RecognitionModal 
        isOpen={isRecognitionOpen} 
        onClose={() => setIsRecognitionOpen(false)} 
        onResult={handleRecognitionResult}
      />
    </ErrorBoundary>
  );
}
