import { Track } from '../types';

const AUDD_API_KEY = import.meta.env.VITE_AUDD_API_KEY;

export async function identifyMusic(audioBlob: Blob): Promise<Track | null> {
  if (!AUDD_API_KEY) {
    console.warn("AudD API key not found, falling back to Gemini...");
    return fallbackToGemini(audioBlob);
  }

  try {
    const formData = new FormData();
    formData.append('api_token', AUDD_API_KEY);
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('return', 'spotify');

    const response = await fetch('https://api.audd.io/', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.status === 'success' && data.result) {
      const result = data.result;
      return {
        id: `audd-${result.song_id || Date.now()}`,
        title: result.title,
        artist: result.artist,
        album: result.album || 'Unknown Album',
        youtubeId: '', // To be filled by bridge
        coverUrl: result.spotify?.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        duration: 0
      };
    }
    
    console.log("AudD did not find a match:", data);
    return null;
  } catch (error) {
    console.error("AudD Recognition Error:", error);
    return fallbackToGemini(audioBlob);
  }
}

async function fallbackToGemini(audioBlob: Blob): Promise<Track | null> {
  // Convert blob to base64
  const base64Audio = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(audioBlob);
  });

  try {
    const response = await fetch((import.meta.env.VITE_API_URL || "") + '/api/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        base64Audio, 
        mimeType: audioBlob.type || 'audio/webm' 
      }),
    });

    const data = await response.json();

    if (data.result && data.result !== 'Unknown') {
      const [title, artist] = data.result.split(' - ');
      return {
        id: `gemini-reco-${Date.now()}`,
        title: title || data.result,
        artist: artist || 'Unknown',
        album: 'Identified by AI',
        youtubeId: '', // To be filled by bridge
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        duration: 0
      };
    }
    return null;
  } catch (error) {
    console.error("Erreur Gemini Recognition:", error);
    return null;
  }
}
