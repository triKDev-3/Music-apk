import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Track } from '../types';
import { searchYouTube } from '../services/youtubeService';
import { db } from '../services/localDbService';
import { INITIAL_TRACKS } from '../data/initialTracks';

interface UsePlayerStateOptions {
  searchResults: Track[];
  user: any; // Firebase User
}

export function usePlayerState({ searchResults, user }: UsePlayerStateOptions) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [isMuted, setIsMuted]           = useState(false);
  const [volume, setVolume]             = useState(0.8);
  const [played, setPlayed]             = useState(0);
  const [duration, setDuration]         = useState(0);
  const playedRef                       = useRef(0);
  const durationRef                     = useRef(0);
  const pendingSeekRef                  = useRef<number | null>(null);
  const pendingAudioSeekRef             = useRef<number | null>(null);
  
  useEffect(() => { playedRef.current = played; }, [played]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  const [repeatMode, setRepeatMode]   = useState<'off' | 'all' | 'one'>(() => {
    return (localStorage.getItem('playme_repeat') as any) || 'off';
  });
  const [isShuffle, setIsShuffle]       = useState(() => {
    return localStorage.getItem('playme_shuffle') === 'true';
  });
  const [isClipMode, setIsClipMode]     = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [hasError, setHasError]         = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sleepTimer, setSleepTimer]     = useState<number | null>(null);
  const [favorites, setFavorites]       = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalTime: 0,
    playCount: {} as Record<string, number>,
    recentlyPlayed: [] as string[],
  });

  const reactPlayerRef = useRef<any>(null);
  const audioRef       = useRef<HTMLAudioElement>(null);
  const playerRef      = reactPlayerRef as any; // compat pour NowPlaying
  const progressTimer  = useRef<number | null>(null);

  // ── Chargement Initial (Firestore ou LocalStorage) ──────────────────────────
  useEffect(() => {
    if (user?.uid) {
      import('../services/dbService').then(({ loadUserData }) => {
        loadUserData(user.uid).then(data => {
          if (data) {
            if (data.favorites) setFavorites(data.favorites);
            if (data.stats) setStats(prev => ({ ...prev, ...data.stats, recentlyPlayed: data.stats.recentlyPlayed || [] }));
          }
        });
      });
    } else {
      try { const s = localStorage.getItem('playme_favorites'); if (s) setFavorites(JSON.parse(s)); } catch {}
      try { 
        const s = localStorage.getItem('playme_stats'); 
        if (s) {
          const parsed = JSON.parse(s);
          setStats(prev => ({ ...prev, ...parsed, recentlyPlayed: parsed.recentlyPlayed || [] }));
        }
      } catch {}
    }
  }, [user?.uid]);

  // ── Persistance (Firestore ou LocalStorage) ─────────────────────────────────
  useEffect(() => {
    if (user?.uid) {
      import('../services/dbService').then(({ saveUserData }) => {
        saveUserData(user.uid, { favorites });
      });
    } else {
      localStorage.setItem('playme_favorites', JSON.stringify(favorites));
    }
  }, [favorites, user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      import('../services/dbService').then(({ saveUserData }) => {
        saveUserData(user.uid, { stats });
      });
    } else {
      localStorage.setItem('playme_stats', JSON.stringify(stats));
    }
  }, [stats, user?.uid]);

  useEffect(() => {
    localStorage.setItem('playme_repeat', repeatMode);
  }, [repeatMode]);

  useEffect(() => {
    localStorage.setItem('playme_shuffle', isShuffle.toString());
  }, [isShuffle]);

  // ── File d'attente Dynamique ──────────────────────────────────────────────
  const [activeQueue, setActiveQueue]   = useState<Track[]>(INITIAL_TRACKS);
  const [localUrl, setLocalUrl]         = useState<string | null>(null);

  useEffect(() => {
    if (searchResults.length > 0) {
      setActiveQueue(searchResults);
    }
  }, [searchResults]);

  // ── Fonctions skip (stables via ref) ─────────────────────────────────────
  // On les définit comme fonctions normales mais on les expose via ref pour
  // éviter les closures stale dans handleEnded.
  const currentTrackRef  = useRef(currentTrack);
  const trackQueueRef    = useRef(activeQueue);
  const repeatModeRef    = useRef(repeatMode);
  const isShuffleRef     = useRef(isShuffle);
  const isClipModeRef    = useRef(isClipMode);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { trackQueueRef.current   = activeQueue;  }, [activeQueue]);
  useEffect(() => { repeatModeRef.current   = repeatMode;   }, [repeatMode]);
  useEffect(() => { isShuffleRef.current    = isShuffle;    }, [isShuffle]);
  useEffect(() => { 
    isClipModeRef.current   = isClipMode;   
    if (isClipMode && currentTrack?.youtubeId) {
       setIsLoading(true);
       setHasError(false);
       
       // Sync ReactPlayer to current played time when switching to clip mode
       pendingSeekRef.current = playedRef.current;
       if (reactPlayerRef.current) {
         try {
           reactPlayerRef.current.seekTo(playedRef.current);
         } catch (e) {
           console.warn("Could not seek immediately, waiting for onReady");
         }
       }
    } else if (!isClipMode) {
       // Sync audioRef to current played time when switching back to audio mode
       pendingAudioSeekRef.current = playedRef.current * durationRef.current;
       if (audioRef.current && audioRef.current.readyState >= 1) {
         audioRef.current.currentTime = pendingAudioSeekRef.current;
         pendingAudioSeekRef.current = null;
       }
    }
  }, [isClipMode, currentTrack?.youtubeId]);

  // ── Stream URL Handler (Proxy YouTube & Fichiers Locaux) ───────────────
  useEffect(() => {
    let activeUrl: string | null = null;
    let isCancelled = false;

    if (currentTrack?.id.startsWith('local-')) {
      db.tracks.get(currentTrack.id).then(stored => {
        if (isCancelled) return;
        if (stored?.fileBlob) {
          activeUrl = URL.createObjectURL(stored.fileBlob);
          setLocalUrl(activeUrl);
          console.log('[Player] Local Blob URL created');
        }
      });
    } else if (currentTrack?.youtubeId) {
      setLocalUrl(`/api/stream?id=${currentTrack.youtubeId}`);
    } else {
      setLocalUrl(null);
    }
    
    return () => {
      isCancelled = true;
      if (activeUrl && currentTrack?.id.startsWith('local-')) {
         URL.revokeObjectURL(activeUrl);
         console.log('[Player] Local Blob URL revoked');
      }
    };
  }, [currentTrack?.youtubeId, currentTrack?.id]);

  // playTrack avec gestion de file d'attente contextuelle
  const playTrack = useCallback((track: Track, customQueue?: Track[]) => {
    if (!track) return;
    
    if (customQueue && customQueue.length > 0) {
      setActiveQueue(customQueue);
    } else if (searchResults.length === 0 && !activeQueue.find(t => t.id === track.id)) {
      const all = [...INITIAL_TRACKS, ...searchResults];
      const related = all.filter(t => t.mood === track.mood);
      setActiveQueue(related.length > 0 ? related : [track]);
    }

    // Si on demande de jouer le même morceau, on force le redémarrage
    if (currentTrackRef.current?.id === track.id) {
      if (!isClipModeRef.current && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      } else if (reactPlayerRef.current && typeof reactPlayerRef.current.seekTo === 'function') {
        reactPlayerRef.current.seekTo(0);
      }
      setPlayed(0);
      setIsPlaying(true);
      return;
    }

    console.log('[Player] Playing:', track.title, '| ID:', track.youtubeId);
    
    const finalizePlay = (t: Track) => {
      setCurrentTrack(t);
      setIsPlaying(true);
      setDuration(t.duration || 0);
      setPlayed(0);
      setIsLoading(true);
      setHasError(false);

      setStats(prev => {
        const safe = prev || { totalTime: 0, playCount: {}, recentlyPlayed: [] };
        const playCount = { ...safe.playCount, [t.id]: (safe.playCount[t.id] || 0) + 1 };
        const recentlyPlayed = [t.id, ...safe.recentlyPlayed.filter(id => id !== t.id)].slice(0, 20);
        return { ...safe, playCount, recentlyPlayed };
      });

      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: t.title,
            artist: t.artist,
            album: t.album || 'Play Me',
            artwork: [{ src: t.coverUrl || '', sizes: '512x512', type: 'image/jpeg' }],
          });
        } catch {}
      }

      if (!isClipModeRef.current && audioRef.current) {
        audioRef.current.playbackRate = playbackRate;
      }
    };

    // ── Bridge Spotify → YouTube (si youtubeId manquant) ─────────────────────
    if (track.id.startsWith('spotify-') && !track.youtubeId) {
      console.log('[Bridge] Spotify track detected, starting playback with background search.');
      // On lance la lecture immédiatement avec les métadonnées
      // Le useEffect de recherche en arrière-plan se chargera de trouver le youtubeId
      finalizePlay(track);
      return; 
    }

    finalizePlay(track);
  }, [searchResults, activeQueue, playbackRate]);

  const skipToNextImpl = useCallback((manual = true) => {
    const ct  = currentTrackRef.current;
    const q   = trackQueueRef.current;
    if (!ct || q.length === 0) return;
    const idx  = q.findIndex(t => t.id === ct.id);
    
    // Si pas manuel et mode 'off', on s'arrête à la fin de la file
    if (!manual && repeatModeRef.current === 'off' && idx === q.length - 1) {
      setIsPlaying(false);
      return;
    }

    const next = isShuffleRef.current
      ? Math.floor(Math.random() * q.length)
      : (idx + 1) % q.length;
    playTrack(q[next], q);
  }, [playTrack]);

  const skipToPrevImpl = useCallback(() => {
    const ct  = currentTrackRef.current;
    const q   = trackQueueRef.current;
    if (!ct || q.length === 0) return;
    const idx  = q.findIndex(t => t.id === ct.id);
    const prev = isShuffleRef.current
      ? Math.floor(Math.random() * q.length)
      : (idx - 1 + q.length) % q.length;
    playTrack(q[prev], q);
  }, [playTrack]);

  const handleEnded = useCallback(() => {
    const mode = repeatModeRef.current;
    if (mode === 'one') {
      if (!isClipModeRef.current && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      } else if (reactPlayerRef.current) {
        reactPlayerRef.current.seekTo(0);
        setIsPlaying(true);
      }
    } else {
      // Pour 'all' ou 'off', on passe à la suivante
      // skipToNextImpl gère l'arrêt en fin de file si 'off'
      skipToNextImpl(false);
    }
  }, [skipToNextImpl]);
  // ── Audio HTML5 (Fichiers importés uniquement) ───────────────
  useEffect(() => {
    const audio = audioRef.current;
    const isLocal = currentTrack?.id.startsWith('local-');
    
    // On n'utilise la balise <audio> QUE pour les fichiers locaux.
    // Pour YouTube, on utilise ReactPlayer (même masqué) pour éviter les proxys backend instables sur Vercel.
    const shouldPlayAudio = isPlaying && isLocal;

    if (!audio || !localUrl || !shouldPlayAudio) {
       if (audio && !audio.paused) audio.pause();
       return;
    }

    audio.volume = isMuted ? 0 : volume;

    const onCanPlay = () => {
      setIsLoading(false);
      if (pendingAudioSeekRef.current !== null) {
        audio.currentTime = pendingAudioSeekRef.current;
        pendingAudioSeekRef.current = null;
      }
    };
    const onWaiting = () => setIsLoading(true);
    const onTimeUpdate = () => {
      let d = audio.duration;
      if (!d || !isFinite(d)) d = currentTrackRef.current?.duration || 0;
      
      if (d > 0) {
        setPlayed(audio.currentTime / d);
        setDuration(d);
        setIsLoading(false);
      }
    };

    const onError = (e: any) => {
      console.error("Audio element error:", e);
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
    };

    const onLoadedMetadata = () => {
      if (pendingAudioSeekRef.current !== null) {
        audio.currentTime = pendingAudioSeekRef.current;
        pendingAudioSeekRef.current = null;
      }
    };

    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('error', onError);

    if (isPlaying) {
      if (!localUrl) {
        setIsLoading(true);
      } else {
        if (audio.readyState >= 3) setIsLoading(false);
        else setIsLoading(true);
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name !== 'AbortError') {
              console.error("Local play error:", e);
              setIsPlaying(false);
              setHasError(true);
            }
          });
        }
      }
    } else {
      audio.pause();
    }

    return () => { 
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('error', onError);
    };
  }, [isPlaying, currentTrack, isMuted, volume, localUrl]);

  // ── Volume audio local en temps réel ─────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (sleepTimer === null) return;
    if (sleepTimer <= 0) {
      setIsPlaying(false);
      setSleepTimer(null);
      return;
    }
    const tid = setInterval(() => setSleepTimer(s => (s ? s - 1 : 0)), 60000); // Décompte par minute
    return () => clearInterval(tid);
  }, [sleepTimer]);

  // ── Media Session actions ─────────────────────────────────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play',          () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause',         () => setIsPlaying(false));
    navigator.mediaSession.setActionHandler('nexttrack',     () => skipToNextImpl());
    navigator.mediaSession.setActionHandler('previoustrack', () => skipToPrevImpl());
  }, [skipToNextImpl, skipToPrevImpl]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleFavorite = useCallback((trackId: string) =>
    setFavorites(prev =>
      prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId]
    ), []);

  const handleReady = useCallback(() => {
    setIsLoading(false);
    if (pendingSeekRef.current !== null && reactPlayerRef.current) {
      reactPlayerRef.current.seekTo(pendingSeekRef.current);
      pendingSeekRef.current = null;
    }
  }, []);

  const handleTimeUpdate = useCallback((state: any) => {
    // ReactPlayer onProgress returns { played, playedSeconds, loaded, loadedSeconds }
    if (state && typeof state.played === 'number') {
      setPlayed(state.played);
      if (state.playedSeconds > 0) setIsLoading(false);
    }
  }, []);

  const handleDurationChange = useCallback((d: number) => {
    if (typeof d === 'number' && d > 0) {
      setDuration(d);
      setIsLoading(false); // On a la durée, c'est que c'est prêt
    }
  }, []);

  const handleError = useCallback((e: any) => {
    console.error('[Player Error]', e);
    setHasError(true);
    setIsLoading(false);
  }, []);

  const handleDuration = useCallback((d: number) => {
    if (d > 0) setDuration(d);
  }, []);

  const handleSeekChange = useCallback((val: number) => {
    setPlayed(val);
    if (!isClipModeRef.current && audioRef.current) {
      audioRef.current.currentTime = val * audioRef.current.duration;
    } else if (reactPlayerRef.current) {
      // react-player uses seekTo(fraction)
      reactPlayerRef.current.seekTo(val);
    }
  }, []);

  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const youtubeId = useMemo(() => {
    return currentTrack ? currentTrack.youtubeId : null;
  }, [currentTrack]);

  // Background clip search for local tracks or tracks without youtubeId
  useEffect(() => {
    if (!currentTrack) return;
    
    // On cherche un clip si :
    // 1. On n'a pas de youtubeId du tout (ex: Spotify, local)
    // 2. On a un youtubeId mais on veut s'assurer d'avoir le "Clip Officiel" pour le mode vidéo
    const needsAudioId = !currentTrack.youtubeId || currentTrack.youtubeId === 'local-blob';
    
    const fetchClip = async () => {
      try {
        let audioId = currentTrack.youtubeId;
        let foundOfficial = false;

        // 1. Recherche initiale (Audio + Clip potentiel)
        console.log('[Background Search] Searching for:', currentTrack.title);
        const query = `${currentTrack.artist} ${currentTrack.title}`;
        const ytResults = await searchYouTube(query);
        
        if (ytResults && ytResults.length > 0) {
          const topResult = ytResults[0];
          audioId = topResult.youtubeId;
          
          // On vérifie si le premier résultat est déjà un clip officiel
          const titleLower = topResult.title.toLowerCase();
          foundOfficial = titleLower.includes('official') || titleLower.includes('clip') || titleLower.includes('video');

          // Mise à jour immédiate pour l'audio (si on n'avait rien ou si on avait local-blob)
          setCurrentTrack(prev => {
            if (prev && prev.id === currentTrack.id && (!prev.youtubeId || prev.youtubeId === 'local-blob')) {
              console.log('[Background Search] Found initial ID for', currentTrack.title, ':', audioId);
              return { 
                ...prev, 
                youtubeId: audioId,
                coverUrl: topResult.coverUrl || prev.coverUrl,
                duration: topResult.duration || prev.duration
              };
            }
            return prev;
          });
        }

        // 2. Si on n'a pas encore trouvé de clip officiel, on fait une recherche plus spécifique
        if (!foundOfficial) {
          console.log('[Background Search] Searching for official clip for:', currentTrack.title);
          const clipQuery = `${currentTrack.artist} ${currentTrack.title} official video clip`;
          const clipResults = await searchYouTube(clipQuery);
          
          if (clipResults && clipResults.length > 0) {
            const clipResult = clipResults[0];
            
            setCurrentTrack(prev => {
              if (prev && prev.id === currentTrack.id) {
                // On met à jour si l'ID est différent (on a trouvé mieux)
                if (prev.youtubeId !== clipResult.youtubeId) {
                  console.log('[Background Search] Found better official clip for', currentTrack.title, ':', clipResult.youtubeId);
                  return { 
                    ...prev, 
                    youtubeId: clipResult.youtubeId,
                    coverUrl: clipResult.coverUrl || prev.coverUrl,
                    duration: clipResult.duration || prev.duration
                  };
                }
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error('[Background Search] Failed to find clip:', err);
      }
    };

    fetchClip();
  }, [currentTrack?.id]);

  return {
    currentTrack, isPlaying, setIsPlaying,
    isMuted,      setIsMuted,
    volume,       setVolume,
    played,       setPlayed,
    duration,     setDuration,
    repeatMode,   setRepeatMode,
    isShuffle,    setIsShuffle,
    isClipMode,   setIsClipMode,
    isLoading,    setIsLoading,
    hasError,     setHasError,
    playbackRate, setPlaybackRate,
    sleepTimer,   setSleepTimer,
    activeQueue,  setActiveQueue,
    favorites,    stats,
    playerRef,    reactPlayerRef, audioRef,
    playTrack,    toggleFavorite,
    handleTimeUpdate, handleDurationChange, handleSeekChange, handleReady,
    handleError,
    formatTime,
    skipToNext: skipToNextImpl,
    skipToPrev: skipToPrevImpl,
    handleEnded,
    youtubeId,
    localUrl,
  };
}
