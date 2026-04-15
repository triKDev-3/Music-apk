import { Track } from '../types';

const BASE = 'https://www.googleapis.com/youtube/v3';

// Token OAuth de l'utilisateur connecté (mis à jour après connexion Google)
let _oauthToken: string | null = localStorage.getItem('playme_youtube_token');

/**
 * Stores the YouTube OAuth token for the current session.
 * @param token The OAuth 2.0 access token or null to clear.
 */
export function setYouTubeOAuthToken(token: string | null) {
  _oauthToken = token;
  if (token) {
    console.log('[YouTube] OAuth token set. API calls will use user credentials.');
  } else {
    // Falls back to API Key or Backend if token is missing
    console.warn('[YouTube] No OAuth token. Using fallback methods.');
  }
}

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

/** Retourne les headers appropriés selon l'authent disponible */
function getHeaders(): HeadersInit {
  if (_oauthToken) {
    return { Authorization: `Bearer ${_oauthToken}` };
  }
  return {};
}

function getApiUrl(endpoint: string, params: string): string {
  let url = `${BASE}/${endpoint}?${params}`;
  if (!_oauthToken && YOUTUBE_API_KEY) {
    url += `&key=${YOUTUBE_API_KEY}`;
  }
  return url;
}

/** Parse ISO 8601 duration (PT4M33S) → seconds */
function parseDuration(iso: string): number {
  if (!iso) return 180;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 180;
  return (+(match[1] || 0)) * 3600 + (+(match[2] || 0)) * 60 + (+(match[3] || 0));
}

let _isQuotaExceeded = false;

/** Recherche des vidéos YouTube Music via OAuth ou Backend Fallback */
export async function searchYouTube(query: string): Promise<Track[]> {
  // 1. Si on sait déjà que le quota est dépassé, on va direct au backend
  if (_isQuotaExceeded) {
    console.log('[YouTube] Quota dépassé — Utilisation directe du Backend.');
    return fetchFromBackend(query);
  }

  // 2. Si aucune auth, on tente quand même l'API Key ou on bascule au backend
  // Check for missing or placeholder API key
  const isInvalidKey = !YOUTUBE_API_KEY || 
                      YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY' || 
                      YOUTUBE_API_KEY === '' || 
                      YOUTUBE_API_KEY === 'undefined' || 
                      YOUTUBE_API_KEY === 'null';

  if (!_oauthToken && isInvalidKey) {
    return fetchFromBackend(query);
  }

  try {
    // Sanitize query: Remove metadata prefixes like "Fichier local "
    const sanitizedQuery = query.replace(/^Fichier local\s+/i, '').trim();
    
    const params = `part=snippet&q=${encodeURIComponent(sanitizedQuery)}&type=video&maxResults=50`;
    const searchUrl = getApiUrl('search', params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(searchUrl, { 
      headers: getHeaders(),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // SYSTEMATIC FALLBACK: Status 401 (Unauthorized), 403 (Quota), or 400 (Bad Request)
    if (res.status === 401 || res.status === 403 || res.status === 400) {
      console.warn(`[YouTube] API returned ${res.status}. Switching to Backend for query: "${sanitizedQuery}"`);
      // Si 400 ou 403, on marque le quota comme dépassé pour ne plus polluer la console
      _isQuotaExceeded = true;
      return fetchFromBackend(sanitizedQuery);
    }

    const data = await res.json();

    if (data.error) {
      console.error('[YouTube] API Error:', data.error.message);
      return fetchFromBackend(query);
    }

    if (!data.items || data.items.length === 0) {
        return fetchFromBackend(query);
    }

    // Récupère les durées en un second appel
    const ids = data.items.map((i: any) => i.id.videoId).filter(Boolean).join(',');
    let durationMap: Record<string, number> = {};

    try {
      const params = `part=contentDetails&id=${ids}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const detailRes = await fetch(getApiUrl('videos', params), { 
        headers: getHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const detailData = await detailRes.json();
      (detailData.items || []).forEach((item: any) => {
        durationMap[item.id] = parseDuration(item.contentDetails?.duration || '');
      });
    } catch (e) {
      console.warn('[YouTube] Duration fetch failed', e);
    }

    return data.items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        album: 'YouTube Music',
        coverUrl:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url,
        duration: durationMap[item.id.videoId] || 180,
        youtubeId: item.id.videoId,
        source: 'youtube',
      }));
  } catch (err) {
    console.error('[YouTube] Search failed:', err);
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[YouTube] Search timed out, falling back to backend.');
    }
    return fetchFromBackend(query);
  }
}

/**
 * Fallback to secondary backend API or public Invidious instances if the primary YouTube API fails.
 * @param query The search query.
 */
async function fetchFromBackend(query: string): Promise<Track[]> {
    // 1. Try our own backend first (if available)
    try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        if (apiUrl) {
          console.log(`[YouTube] Backend fallback search for: "${query}"`);
          const res = await fetch(`${apiUrl}/api/search/youtube?q=${encodeURIComponent(query)}`);
          if (res.ok) {
              const data = await res.json();
              const results = Array.isArray(data) ? data : (data.items || []);
              if (results.length > 0) return results;
          }
        }
    } catch (e) {
        console.warn('[YouTube] Backend search unavailable, trying Invidious...');
    }

    // 2. ZERO SERVER FALLBACK: Try Public Invidious Search (with CORS Proxy for Web stability)
    const INVIDIOUS_INSTANCES = ['https://yewtu.be', 'https://inv.vern.cc', 'https://vid.priv.au'];
    const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
    
    for (const instance of INVIDIOUS_INSTANCES) {
      try {
        console.log(`[YouTube] Invidious search fallback (${instance}) for: "${query}"`);
        const targetUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
        
        // On utilise un proxy CORS uniquement sur le web pour éviter les blocages Vercel
        const fetchUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
          ? `${CORS_PROXY}${encodeURIComponent(targetUrl)}`
          : targetUrl;

        const res = await fetch(fetchUrl);
        if (!res.ok) continue;

        const data = await res.json();
        return data.map((item: any) => ({
          id: item.videoId,
          youtubeId: item.videoId,
          title: item.title,
          artist: item.author,
          coverUrl: item.videoThumbnails?.find((t: any) => t.quality === 'high')?.url || item.videoThumbnails?.[0]?.url,
          duration: item.lengthSeconds,
          source: 'youtube'
        }));
      } catch (err) {
        continue;
      }
    }

    return getMockResults(query);
}

/** Résultats de secours enrichis (utilisés sans connexion ou en cas d'échec total) */
export function getMockResults(query: string): Track[] {
  const q = query.toLowerCase().trim();

  const mockDB: Record<string, Track[]> = {
    gims: [
      { id: 'gims1', title: 'Spider (ft. Dystinct)', artist: 'Gims', album: 'Spider', coverUrl: 'https://i.ytimg.com/vi/X_W_q-K0Y-w/hqdefault.jpg', duration: 185, youtubeId: 'X_W_q-K0Y-w' },
      { id: 'gims2', title: 'Bella', artist: 'Gims', album: 'Subliminal', coverUrl: 'https://i.ytimg.com/vi/rClUvS2-T-o/hqdefault.jpg', duration: 210, youtubeId: 'rClUvS2-T-o' },
      { id: 'gims3', title: 'Sapés Comme Jamais', artist: 'Gims', album: 'M.C.A.R.', coverUrl: 'https://i.ytimg.com/vi/4bS_fXpntR8/hqdefault.jpg', duration: 230, youtubeId: '4bS_fXpntR8' },
    ],
    dadju: [
      { id: 'dad1', title: 'Reine', artist: 'Dadju', album: 'Gentleman 2.0', coverUrl: 'https://i.ytimg.com/vi/tVKaN_H3SLA/hqdefault.jpg', duration: 215, youtubeId: 'tVKaN_H3SLA' },
      { id: 'dad2', title: 'Bob Marley', artist: 'Dadju', album: 'Gentleman 2.0', coverUrl: 'https://i.ytimg.com/vi/2I9X_yETozI/hqdefault.jpg', duration: 200, youtubeId: '2I9X_yETozI' },
      { id: 'dad3', title: 'Django', artist: 'Dadju', album: 'Gentleman 2.0', coverUrl: 'https://i.ytimg.com/vi/XInW75e7W7U/hqdefault.jpg', duration: 220, youtubeId: 'XInW75e7W7U' },
    ],
    tiakola: [
      { id: 'tia1', title: 'Meuda (Clip Officiel)', artist: 'TiakolaVEVO',      album: 'Mélo',       coverUrl: 'https://i.ytimg.com/vi/q_G_itv1lGo/hqdefault.jpg',  duration: 155, youtubeId: 'q_G_itv1lGo' },
      { id: 'tia2', title: 'Gasolina ft. Rsko',    artist: 'Tiakola',           album: 'Mélo',       coverUrl: 'https://i.ytimg.com/vi/2R2fB79yT9I/hqdefault.jpg',  duration: 215, youtubeId: '2R2fB79yT9I' },
      { id: 'tia3', title: 'Parapluie',            artist: 'Tiakola',           album: 'Mélo',       coverUrl: 'https://i.ytimg.com/vi/Dq-pG7mmsWc/hqdefault.jpg',  duration: 205, youtubeId: 'Dq-pG7mmsWc' },
      { id: 'tia4', title: 'CARTIER ft. Tiakola',  artist: 'Gazo',              album: 'KMT',        coverUrl: 'https://i.ytimg.com/vi/Vv-u-P6o070/hqdefault.jpg',  duration: 195, youtubeId: 'Vv-u-P6o070' },
      { id: 'tia5', title: 'Luna',                 artist: 'Tiakola',           album: 'Luna',       coverUrl: 'https://i.ytimg.com/vi/4QjQomTUGXE/hqdefault.jpg',  duration: 190, youtubeId: '4QjQomTUGXE' },
    ],
    gazo: [
      { id: 'gz1',  title: 'DIE',                  artist: 'Gazo',              album: 'KMT',        coverUrl: 'https://i.ytimg.com/vi/QzZflH4liuU/hqdefault.jpg',  duration: 229, youtubeId: 'QzZflH4liuU' },
      { id: 'gz2',  title: 'CARTIER ft. Tiakola',  artist: 'Gazo',              album: 'KMT',        coverUrl: 'https://i.ytimg.com/vi/Vv-u-P6o070/hqdefault.jpg',  duration: 195, youtubeId: 'Vv-u-P6o070' },
    ],
    aya: [
      { id: 'aya1', title: 'Djadja',               artist: 'Aya Nakamura',      album: 'Nakamura',   coverUrl: 'https://i.ytimg.com/vi/GpNNMJkySBs/hqdefault.jpg',  duration: 192, youtubeId: 'GpNNMJkySBs' },
      { id: 'aya2', title: 'Copines',              artist: 'Aya Nakamura',      album: 'Nakamura',   coverUrl: 'https://i.ytimg.com/vi/3vZhCOYFdxI/hqdefault.jpg',  duration: 203, youtubeId: '3vZhCOYFdxI' },
    ],
    ninho: [
      { id: 'nin1', title: 'M à P',               artist: 'Ninho',             album: 'M à P',      coverUrl: 'https://i.ytimg.com/vi/6vVHl5E1pno/hqdefault.jpg',  duration: 240, youtubeId: '6vVHl5E1pno' },
      { id: 'nin2', title: 'Lettre à une femme',  artist: 'Ninho',             album: 'Santé',      coverUrl: 'https://i.ytimg.com/vi/0bGGq8bLZJY/hqdefault.jpg',  duration: 220, youtubeId: '0bGGq8bLZJY' },
    ],
    sch: [
      { id: 'sch1', title: 'Fils De.',            artist: 'SCH',               album: 'JVLIVS II',  coverUrl: 'https://i.ytimg.com/vi/3kTBAvQulYk/hqdefault.jpg',  duration: 260, youtubeId: '3kTBAvQulYk' },
    ],
    damso: [
      { id: 'dam1', title: 'Macarena',            artist: 'Damso',             album: 'Lithopédion', coverUrl: 'https://i.ytimg.com/vi/Z-j8yGbN7OE/hqdefault.jpg', duration: 214, youtubeId: 'Z-j8yGbN7OE' },
    ],
  };

  // Cherche dans la base mock
  for (const [key, tracks] of Object.entries(mockDB)) {
    if (q.includes(key)) return tracks;
  }

  // Fallback générique
  return [
    { id: 'lofi1', title: 'Lofi Hip Hop Radio',   artist: 'Lofi Girl',         album: 'Relax',      coverUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',  duration: 0,   youtubeId: 'jfKfPfyJRdk' },
    { id: 'wb1',   title: 'Starboy',              artist: 'The Weeknd',        album: 'Starboy',    coverUrl: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',  duration: 230, youtubeId: '34Na4j8AVgA' },
  ];
}

/** Flux en direct — nécessite OAuth */
export async function searchLiveMusic(): Promise<Track[]> {
  if (!_oauthToken && !YOUTUBE_API_KEY) return [];

  try {
    const params = `part=snippet&type=video&eventType=live&maxResults=8`;
    const searchUrl = getApiUrl('search', params);

    const res = await fetch(searchUrl, { headers: getHeaders() });
    const data = await res.json();


    if (!data.items) return [];

    return data.items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        album: 'Live Streaming',
        coverUrl:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.default?.url,
        duration: 0,
        youtubeId: item.id.videoId,
        mood: 'chill',
      }));
  } catch (err) {
    console.error('[YouTube] Live search failed:', err);
    return [];
  }
}

/** Récupère les playlists de l'utilisateur connecté */
export async function getMyYouTubePlaylists(): Promise<any[]> {
  if (!_oauthToken) return [];

  try {
    const params = `part=snippet,contentDetails&mine=true&maxResults=50`;
    const url = getApiUrl('playlists', params);

    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();

    if (data.error) {
      if (data.error.code === 401) {
        console.warn('[YouTube] Token expiré, déconnexion...');
        localStorage.removeItem('playme_youtube_token');
        _oauthToken = null;
      }
      return [];
    }

    return (data.items || []).map((item: any) => ({
      id: item.id,
      name: item.snippet.title,
      description: item.snippet.description,
      itemCount: item.contentDetails?.itemCount || 0,
      coverUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      source: 'youtube'
    }));
  } catch (err) {
    console.error('[YouTube] Failed to fetch playlists:', err);
    return [];
  }
}

/** Récupère les vidéos d'une playlist YouTube */
export async function getYouTubePlaylistItems(playlistId: string): Promise<Track[]> {
  if (!_oauthToken && !YOUTUBE_API_KEY) return [];

  try {
    const params = `part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50`;
    const url = getApiUrl('playlistItems', params);

    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();

    if (!data.items) return [];

    return data.items.map((item: any) => ({
      id: item.contentDetails?.videoId || item.id,
      title: item.snippet.title,
      artist: item.snippet.videoOwnerChannelTitle || 'YouTube',
      album: 'YouTube Playlist',
      coverUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      duration: 0,
      youtubeId: item.contentDetails?.videoId,
      source: 'youtube'
    }));
  } catch (err) {
    console.error('[YouTube] Failed to fetch playlist items:', err);
    return [];
  }
}
