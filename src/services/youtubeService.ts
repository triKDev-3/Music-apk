import { Track } from '../types';

const BASE = 'https://www.googleapis.com/youtube/v3';

// Token OAuth de l'utilisateur connecté (mis à jour après connexion Google)
let _oauthToken: string | null = null;

/** Appelé après une connexion Google réussie pour stocker le token */
export function setYouTubeOAuthToken(token: string | null) {
  _oauthToken = token;
  if (token) {
    console.log('[YouTube] OAuth token set. API calls will use user credentials.');
  } else {
    console.warn('[YouTube] No OAuth token. Will use mock results.');
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
  if (!_oauthToken && !YOUTUBE_API_KEY) {
    return fetchFromBackend(query);
  }

  try {
    const params = `part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=15`;
    const searchUrl = getApiUrl('search', params);

    const res = await fetch(searchUrl, { headers: getHeaders() });

    if (res.status === 403) {
      console.warn('[YouTube] Quota API dépassé (403). Activation du mode Backend.');
      _isQuotaExceeded = true;
      return fetchFromBackend(query);
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
      const detailRes = await fetch(getApiUrl('videos', params), { headers: getHeaders() });
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
      }));
  } catch (err) {
    console.error('[YouTube] Search failed:', err);
    return fetchFromBackend(query);
  }
}

/** Assistant pour appeler le backend de secours */
async function fetchFromBackend(query: string): Promise<Track[]> {
    try {
        console.log(`[YouTube] Recherche Backend pour: "${query}"`);
        const res = await fetch(`http://localhost:4000/search?q=${encodeURIComponent(query)}`);
        if (res.ok) return await res.json();
        throw new Error('Backend non disponible');
    } catch (e) {
        console.error('[YouTube] Échec critique recherche:', e);
        return getMockResults(query);
    }
}

/** Résultats de secours enrichis (utilisés sans connexion) */
export function getMockResults(query: string): Track[] {
  const q = query.toLowerCase().trim();

  const mockDB: Record<string, Track[]> = {
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
    const params = `part=snippet&type=video&eventType=live&videoCategoryId=10&maxResults=8`;
    const url = getApiUrl('search', params);
    const res = await fetch(url, { headers: getHeaders() });
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
