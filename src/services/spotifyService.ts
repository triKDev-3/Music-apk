import { Track } from '../types';
import { searchYouTube } from './youtubeService';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Obtenir un token d'accès Spotify via Client Credentials Flow
 */
async function getAccessToken(): Promise<string | null> {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  try {
    const response = await fetch('/api/spotify/token');
    const data = await response.json();
    if (data.access_token) {
      accessToken = data.access_token;
      tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60000;
      return accessToken;
    }
  } catch (error) {
    console.error('[Spotify] Erreur lors de l\'obtention du token:', error);
  }
  return null;
}

/**
 * Recherche des titres sur Spotify
 */
export async function searchSpotify(query: string): Promise<Track[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    if (!data.tracks?.items) return [];

    return data.tracks.items.map((item: any) => ({
      id: `spotify-${item.id}`,
      title: item.name,
      artist: item.artists.map((a: any) => a.name).join(', '),
      album: item.album.name,
      coverUrl: item.album.images[0]?.url || item.album.images[1]?.url || '',
      duration: Math.floor(item.duration_ms / 1000),
      youtubeId: '', // À compléter au moment de la lecture
      source: 'spotify',
    }));
  } catch (error) {
    console.error('[Spotify] Erreur lors de la recherche:', error);
    return [];
  }
}

/**
 * Récupère le youtubeId pour un titre Spotify (Bridging)
 */
export async function getYouTubeIdForSpotifyTrack(track: Track): Promise<string | null> {
  const query = `${track.artist} - ${track.title} audio`;
  try {
    const results = await searchYouTube(query);
    if (results.length > 0) {
      return results[0].youtubeId;
    }
  } catch (error) {
    console.error('[Spotify-Bridge] Erreur recherche YouTube:', error);
  }
  return null;
}
