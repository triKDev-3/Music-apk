import { Track } from "../types";
import { getMockResults } from "./youtubeService";

// Base de données de chansons réelles pour enrichir les résultats Gemini
const REAL_TRACKS_BY_MOOD: Record<string, Track[]> = {
  chill: [
    { id: 'ch1', title: 'Lofi Hip Hop Radio', artist: 'Lofi Girl', album: 'Relax', coverUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg', duration: 0, youtubeId: 'jfKfPfyJRdk' },
    { id: 'ch2', title: 'Meuda', artist: 'Tiakola', album: 'Mélo', coverUrl: 'https://i.ytimg.com/vi/q_G_itv1lGo/hqdefault.jpg', duration: 155, youtubeId: 'q_G_itv1lGo' },
    { id: 'ch3', title: 'Djadja', artist: 'Aya Nakamura', album: 'Nakamura', coverUrl: 'https://i.ytimg.com/vi/GpNNMJkySBs/hqdefault.jpg', duration: 192, youtubeId: 'GpNNMJkySBs' },
    { id: 'ch4', title: 'Sunny Day', artist: 'Petit Biscuit', album: 'Presence', coverUrl: 'https://i.ytimg.com/vi/VBmCLD3IYQU/hqdefault.jpg', duration: 210, youtubeId: 'VBmCLD3IYQU' },
    { id: 'ch5', title: 'Parapluie', artist: 'Tiakola', album: 'Mélo', coverUrl: 'https://i.ytimg.com/vi/Dq-pG7mmsWc/hqdefault.jpg', duration: 205, youtubeId: 'Dq-pG7mmsWc' },
  ],
  motivation: [
    { id: 'mo1', title: 'DIE', artist: 'Gazo', album: 'KMT', coverUrl: 'https://i.ytimg.com/vi/QzZflH4liuU/hqdefault.jpg', duration: 229, youtubeId: 'QzZflH4liuU' },
    { id: 'mo2', title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', coverUrl: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg', duration: 230, youtubeId: '34Na4j8AVgA' },
    { id: 'mo3', title: 'M à P', artist: 'Ninho', album: 'M à P', coverUrl: 'https://i.ytimg.com/vi/6vVHl5E1pno/hqdefault.jpg', duration: 240, youtubeId: '6vVHl5E1pno' },
    { id: 'mo4', title: 'Macarena', artist: 'Damso', album: 'Lithopédion', coverUrl: 'https://i.ytimg.com/vi/Z-j8yGbN7OE/hqdefault.jpg', duration: 214, youtubeId: 'Z-j8yGbN7OE' },
    { id: 'mo5', title: 'CARTIER', artist: 'Gazo ft. Tiakola', album: 'KMT', coverUrl: 'https://i.ytimg.com/vi/Vv-u-P6o070/hqdefault.jpg', duration: 195, youtubeId: 'Vv-u-P6o070' },
  ],
  love: [
    { id: 'lo1', title: 'Gasolina ft. Rsko', artist: 'Tiakola', album: 'Mélo', coverUrl: 'https://i.ytimg.com/vi/2R2fB79yT9I/hqdefault.jpg', duration: 215, youtubeId: '2R2fB79yT9I' },
    { id: 'lo2', title: 'Copines', artist: 'Aya Nakamura', album: 'Nakamura', coverUrl: 'https://i.ytimg.com/vi/3vZhCOYFdxI/hqdefault.jpg', duration: 203, youtubeId: '3vZhCOYFdxI' },
    { id: 'lo3', title: 'Luna', artist: 'Tiakola', album: 'Luna', coverUrl: 'https://i.ytimg.com/vi/4QjQomTUGXE/hqdefault.jpg', duration: 190, youtubeId: '4QjQomTUGXE' },
    { id: 'lo4', title: 'Lettre à une femme', artist: 'Ninho', album: 'Santé', coverUrl: 'https://i.ytimg.com/vi/0bGGq8bLZJY/hqdefault.jpg', duration: 220, youtubeId: '0bGGq8bLZJY' },
  ],
  workout: [
    { id: 'wo1', title: 'Fils De.', artist: 'SCH', album: 'JVLIVS II', coverUrl: 'https://i.ytimg.com/vi/3kTBAvQulYk/hqdefault.jpg', duration: 260, youtubeId: '3kTBAvQulYk' },
    { id: 'wo2', title: 'DIE', artist: 'Gazo', album: 'KMT', coverUrl: 'https://i.ytimg.com/vi/QzZflH4liuU/hqdefault.jpg', duration: 229, youtubeId: 'QzZflH4liuU' },
    { id: 'wo3', title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', coverUrl: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg', duration: 230, youtubeId: '34Na4j8AVgA' },
    { id: 'wo4', title: 'M à P', artist: 'Ninho', album: 'M à P', coverUrl: 'https://i.ytimg.com/vi/6vVHl5E1pno/hqdefault.jpg', duration: 240, youtubeId: '6vVHl5E1pno' },
  ],
};

/** 
 * Recherche des musiques par requête texte (fallback vers Gemini via API backend) 
 * @param query La requête de recherche utilisateur.
 * @returns Une liste de pistes musicales.
 */
export async function searchMusic(query: string): Promise<Track[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/search/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, type: "search" }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
         return data.map((t: any, index: number) => ({
           ...t,
           id: t.youtubeId ? `gemini-${t.youtubeId}-${index}` : `fallback-${index}`,
           coverUrl: t.youtubeId 
             ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` 
             : t.coverUrl,
           duration: t.duration || Math.floor(Math.random() * (240 - 150) + 150),
         }));
      }
    }
    return getMockResults(query);
  } catch (e) {
    console.error("Gemini Search Error:", e);
    return getMockResults(query);
  }
}

/** 
 * Récupère des playlists par ambiance via Gemini + enrichit avec des tracks réels 
 * @param mood L'ambiance souhaitée.
 * @returns Une liste de pistes musicales.
 */
export async function getMoodPlaylists(mood: string): Promise<Track[]> {
  const realTracks = REAL_TRACKS_BY_MOOD[mood] || [];
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/search/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: mood, type: "mood" }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const geminiTracks = Array.isArray(data) ? data.map((t: any) => ({
        ...t,
        coverUrl: t.youtubeId 
          ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` 
          : t.coverUrl,
        duration: t.duration || 180,
      })) : [];
      
      const combined = [...realTracks];
      for (const gt of geminiTracks) {
        if (!combined.find(t => t.youtubeId === gt.youtubeId)) {
          combined.push(gt);
        }
      }
      return combined.slice(0, 12);
    }
  } catch (e) {
    console.error("Gemini Mood Error:", e);
  }
  
  return realTracks;
}

/** 
 * Récupère les paroles d'une chanson via Gemini avec Search Grounding via l'API locale 
 * @param title Titre de la chanson.
 * @param artist Artiste de la chanson.
 * @returns Les paroles ou un message d'erreur.
 */
export async function getLyrics(title: string, artist: string): Promise<string> {
  try {
    const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/lyrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track: { title, artist } })
    });
    
    if (res.ok) {
      const data = await res.json();
      return data.lyrics || "Paroles non disponibles.";
    }
    return "Erreur lors du chargement des paroles.";
  } catch (err) {
    console.error('[Gemini] Lyrics error:', err);
    return "Erreur lors du chargement des paroles.";
  }
}

/** 
 * Generates music metadata and a mock audio URL based on a prompt.
 * @param prompt The user's creative description.
 * @param isFullLength Whether to generate a full length track.
 * @returns Object with audio URL and optional lyrics.
 */
export async function generateMusic(prompt: string, isFullLength: boolean = false): Promise<{ url: string, lyrics?: string }> {
  console.warn("generateMusic is unsupported on the client. It requires a backend implementation with an AI proxy.");
  throw new Error("Music generation is unsupported without backend implementation.");
}

/**
 * Suggests music tracks based on image analysis.
 * @param base64Image Image data in base64.
 * @param mimeType Image format.
 * @returns Array of suggested tracks.
 */
export async function suggestMusicFromImage(base64Image: string, mimeType: string): Promise<Track[]> {
  console.warn("suggestMusicFromImage is unsupported on the client.");
  return [];
}
