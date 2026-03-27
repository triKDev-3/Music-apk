import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactPlayer from 'react-player';
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
    }
  }, [isClipMode, currentTrack?.youtubeId]);

  // ── Stream URL Handler (Proxy YouTube & Fichiers Locaux) ───────────────
  useEffect(() => {
    let activeUrl: string | null = null;
    let isCancelled = false;

    if (currentTrack?.youtubeId === 'local-blob') {
      db.tracks.get(currentTrack.id).then(stored => {
        if (isCancelled) return;
        if (stored?.fileBlob) {
          activeUrl = URL.createObjectURL(stored.fileBlob);
          setLocalUrl(activeUrl);
          console.log('[Player] Local Blob URL created');
        }
      });
    } else if (currentTrack?.youtubeId && !isClipMode) {
      // Audio YouTube : ReactPlayer hors-écran gère la lecture, pas de proxy stream nécessaire
      setLocalUrl(null);
    } else {
      setLocalUrl(null);
    }
    
    return () => {
      isCancelled = true;
      if (activeUrl && currentTrack?.youtubeId === 'local-blob') {
         URL.revokeObjectURL(activeUrl);
         console.log('[Player] Local Blob URL revoked');
      }
    };
  }, [currentTrack?.youtubeId, currentTrack?.id, isClipMode]);

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
    
    // ── Bridge Spotify → YouTube (si youtubeId manquant) ─────────────────────
    if (track.id.startsWith('spotify-') && !track.youtubeId) {
      const bridge = async () => {
        setIsLoading(true);
        const { getYouTubeIdForSpotifyTrack } = await import('../services/spotifyService');
        const vid = await getYouTubeIdForSpotifyTrack(track);
        if (vid) {
          track.youtubeId = vid; // Enrichir l'objet Track localement
          setCurrentTrack({ ...track, youtubeId: vid });
          setIsPlaying(true);
          console.log('[Bridge] Titre Spotify bridgé avec succès.');
        } else {
          console.error('[Bridge] Aucun ID YouTube pour ce titre Spotify.');
          setIsPlaying(false);
          setIsLoading(false);
        }
      };
      bridge();
      return; 
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    setDuration(track.duration || 0);
    setPlayed(0);
    setIsLoading(true);
    setHasError(false);

    setStats(prev => {
      const safe = prev || { totalTime: 0, playCount: {}, recentlyPlayed: [] };
      const playCount = { ...safe.playCount, [track.id]: (safe.playCount[track.id] || 0) + 1 };
      const recentlyPlayed = [track.id, ...safe.recentlyPlayed.filter(id => id !== track.id)].slice(0, 20);
      return { ...safe, playCount, recentlyPlayed };
    });

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album || 'Play Me',
          artwork: [{ src: track.coverUrl || '', sizes: '512x512', type: 'image/jpeg' }],
        });
      } catch {}
    }

    if (!isClipModeRef.current && audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
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

  // ── Audio HTML5 (Fichiers importés & Proxy local Node.js) ───────────────
  useEffect(() => {
    const audio = audioRef.current;
    
    // Si nous n'utilisons pas la balise audio HTML5 (ex: mode vidéo ReactPlayer activé ou pas de flux backend)
    if (!audio || !localUrl) {
       if (audio && !audio.paused && !localUrl) audio.pause();
       return;
    }

    audio.volume = isMuted ? 0 : volume;

    const onCanPlay = () => setIsLoading(false);
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

    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('timeupdate', onTimeUpdate);

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
            }
          });
        }
      }
    } else {
      audio.pause();
    }

    return () => { 
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [isPlaying, currentTrack, isMuted, volume, localUrl]);

  // ── Volume audio local en temps réel ─────────────────────────────────────

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

  const handleTimeUpdate = useCallback((state: any) => {
    // ReactPlayer onProgress returns { played, playedSeconds, loaded, loadedSeconds }
    if (state && typeof state.played === 'number') {
      setPlayed(state.played);
      if (state.playedSeconds > 0) setIsLoading(false);
    }
  }, []);

  const handleDurationChange = useCallback((d: number) => {
    // ReactPlayer onDuration returns the duration number directly
    if (typeof d === 'number' && d > 0) {
      setDuration(d);
    }
  }, []);

  const handleDuration = useCallback((d: number) => {
    if (d > 0) setDuration(d);
  }, []);

  const handleSeekChange = useCallback((val: number) => {
    setPlayed(val);
    if (audioRef.current && !isClipModeRef.current) {
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
    return currentTrack && !currentTrack.id.startsWith('local-') ? currentTrack.youtubeId : null;
  }, [currentTrack]);

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
    handleTimeUpdate, handleDurationChange, handleSeekChange,
    formatTime,
    skipToNext: skipToNextImpl,
    skipToPrev: skipToPrevImpl,
    handleEnded,
    youtubeId,
    localUrl,
  };
}
