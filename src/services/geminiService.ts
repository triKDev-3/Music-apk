import { GoogleGenAI } from "@google/genai";
import { Track } from "../types";
import { getMockResults } from "./youtubeService";

const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
});

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

/** Recherche des musiques par requête texte (fallback vers Gemini) */
export async function searchMusic(query: string): Promise<Track[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `Agis comme l'API de base de données de Spotify/YouTube Music. La requête de l'utilisateur est : "${query}".
          IMPORTANT: Tu DOIS renvoyer EXACTEMENT 20 résultats pertinents. Pas 5, ni 8. 
          Renvoyer UNIQUEMENT un tableau JSON natif (pas de balises Markdown \`\`\`json).
          
          Format attendu :
          [
            {"id":"...","title":"...","artist":"...","album":"...","coverUrl":"https://i.ytimg.com/vi/YOUTUBE_ID/hqdefault.jpg","duration": 180,"youtubeId":"YOUTUBE_ID"}
          ]
          
          RÈGLES VITALES :
          1. Les "youtubeId" DOIVENT être 100% réels et exacts (ceux des vrais clips YouTube).
          2. Ne mets rien d'autre que du JSON.
          3. S'il y a plusieurs artistes dans le titre (feat/ft), garde-les dans le titre.
          `
        }]
      }],
      config: { responseMimeType: "application/json" }
    });

    let text = (response as any).text?.() ?? (response as any).candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return getMockResults(query);
    
    // Nettoyage des balises Markdown (ex: ```json ... ```) 
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(text);
    return (Array.isArray(parsed) ? parsed : []).map((t: Track, index: number) => ({
      ...t,
      // Défense contre les fausses ID
      id: t.youtubeId ? `gemini-${t.youtubeId}-${index}` : `fallback-${index}`,
      coverUrl: t.youtubeId 
        ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` 
        : t.coverUrl,
      duration: t.duration || Math.floor(Math.random() * (240 - 150) + 150), // Durée Random entre 2:30 et 4:00 si manquant
    }));
  } catch (e) {
    console.error("Gemini Search Error:", e);
    return getMockResults(query);
  }
}

/** Récupère des playlists par ambiance via Gemini + enrichit avec des tracks réels */
export async function getMoodPlaylists(mood: string): Promise<Track[]> {
  // Retourner d'abord les tracks réels pour cette ambiance
  const realTracks = REAL_TRACKS_BY_MOOD[mood] || [];
  
  // Essayer d'enrichir avec Gemini
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `Tu es un DJ expert. Suggère 6 chansons populaires françaises et internationales pour une ambiance "${mood}".
          Concentre-toi sur des artistes comme : Tiakola, Gazo, Ninho, SCH, Damso, Aya Nakamura, Jul, Booba, Drake, The Weeknd, etc.
          IMPORTANT: Retourne UNIQUEMENT un tableau JSON valide avec des youtubeId RÉELS de YouTube.
          Format: [{"id":"yt_ID","title":"Titre","artist":"Artiste","album":"Album","coverUrl":"https://i.ytimg.com/vi/YOUTUBE_ID/hqdefault.jpg","duration":180,"youtubeId":"YOUTUBE_ID"}]`
        }]
      }],
      config: { responseMimeType: "application/json" }
    });

    let text = (response as any).text?.() ?? (response as any).candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(text);
      const geminiTracks = Array.isArray(parsed) ? parsed.map((t: Track) => ({
        ...t,
        coverUrl: t.youtubeId 
          ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` 
          : t.coverUrl,
        duration: t.duration || 180,
      })) : [];
      
      // Fusionner : tracks réels en premier, puis suggestions Gemini (sans doublons)
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
  
  // Fallback : uniquement les tracks réels
  return realTracks;
}

/** Récupère les paroles d'une chanson via Gemini */
export async function getLyrics(title: string, artist: string): Promise<string> {
  const prompt = `Trouve les paroles complètes de la chanson "${title}" par "${artist}". 
  Réponds uniquement avec le texte des paroles, sans introduction ni conclusion. 
  Si tu ne trouves pas, indique "Paroles non disponibles pour ce titre."`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    
    const text = (response as any).text?.() ?? (response as any).candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "Paroles non disponibles.";
  } catch (err) {
    console.error('[Gemini] Lyrics error:', err);
    return "Erreur lors du chargement des paroles.";
  }
}