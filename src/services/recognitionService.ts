import { Track } from '../types';

const AUDD_API_KEY = import.meta.env.VITE_AUDD_API_KEY;

export async function identifyMusic(audioBlob: Blob): Promise<Track | null> {
  const formData = new FormData();
  formData.append('file', audioBlob);
  formData.append('api_token', AUDD_API_KEY);
  formData.append('return', 'youtube');

  try {
    const response = await fetch('https://api.audd.io/', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.status === 'success' && data.result) {
      const vid = data.result.youtube?.vid || '';
      return {
        id: `audd-${Date.now()}`,
        title: data.result.title,
        artist: data.result.artist,
        album: data.result.album || 'AudD',
        youtubeId: vid,
        coverUrl: vid 
          ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`
          : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        duration: 0
      };
    }
    return null;
  } catch (error) {
    console.error("Erreur AudD:", error);
    return null;
  }
}
