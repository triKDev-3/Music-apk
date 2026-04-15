/**
 * Client-Side Streaming Service
 * Provides direct audio stream URLs without a backend.
 * Uses a multi-layered fallback system of public proxies.
 */

const INVIDIOUS_INSTANCES = [
  'https://invidious.snopyta.org',
  'https://yewtu.be',
  'https://inv.vern.cc',
  'https://invidious.io.lol',
  'https://invidious.no-logs.com',
  'https://vid.priv.au'
];

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

/**
 * Tries to get a direct audio URL using public Cobalt API
 */
async function getCobaltStream(youtubeId: string): Promise<string | null> {
  try {
    const targetUrl = 'https://api.cobalt.tools/api/json';
    const isWeb = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    
    // Cobalt requires POST, which AllOrigins doesn't support well for body data.
    // So we might have to skip Cobalt CORS proxy or use a different one.
    // For now, let's try direct Cobalt (it usually has CORS enabled).
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${youtubeId}`,
        downloadMode: 'audio',
        audioFormat: 'mp3',
        filenamePattern: 'pretty'
      })
    });
    
    const data = await response.json();
    if (data.status === 'redirect' || data.status === 'stream') {
      return data.url;
    }
    return null;
  } catch (err) {
    console.warn('[Streaming] Cobalt failed:', err);
    return null;
  }
}

/**
 * Tries to get a direct audio URL from Invidious instances
 */
async function getInvidiousStream(youtubeId: string): Promise<string | null> {
  const isWeb = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const targetUrl = `${instance}/api/v1/videos/${youtubeId}`;
      const fetchUrl = isWeb ? `${CORS_PROXY}${encodeURIComponent(targetUrl)}` : targetUrl;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) continue;
      
      const data = await response.json();
      const audioFormats = data.adaptiveFormats.filter((f: any) => 
        f.type.includes('audio') && f.url
      );
      
      if (audioFormats.length > 0) {
        // Sort by bitrate to get decent quality but not too heavy
        audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
        return audioFormats[0].url;
      }
    } catch (err) {
      continue;
    }
  }
  return null;
}

/**
 * Tries to get a direct audio URL from Piped API
 */
async function getPipedStream(youtubeId: string): Promise<string | null> {
  const PIPED_INSTANCES = ['https://pipedapi.kavin.rocks', 'https://pipedapi.rimgo.lol', 'https://piped-api.lunar.icu'];
  const isWeb = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  
  for (const instance of PIPED_INSTANCES) {
    try {
      const targetUrl = `${instance}/streams/${youtubeId}`;
      const fetchUrl = isWeb ? `${CORS_PROXY}${encodeURIComponent(targetUrl)}` : targetUrl;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) continue;
      
      const data = await response.json();
      // Piped gives direct audio streams
      const audioStream = data.audioStreams?.find((s: any) => s.format === 'M4A' || s.format === 'WEB_M');
      return audioStream?.url || data.audioStreams?.[0]?.url || null;
    } catch (err) {
      continue;
    }
  }
  return null;
}

/**
 * Main function to get a playable audio URL
 */
export async function getClientStreamUrl(youtubeId: string): Promise<string> {
  console.log(`[Streaming] Fetching client-side stream for: ${youtubeId}`);
  
  // 1. Try Cobalt (High quality)
  const cobaltUrl = await getCobaltStream(youtubeId);
  if (cobaltUrl) return cobaltUrl;
  
  // 2. Try Piped (Very reliable for streaming)
  const pipedUrl = await getPipedStream(youtubeId);
  if (pipedUrl) {
    console.log('[Streaming] Success via Piped');
    return pipedUrl;
  }
  
  // 3. Try Invidious (Stable fallback)
  const invidiousUrl = await getInvidiousStream(youtubeId);
  if (invidiousUrl) {
    console.log('[Streaming] Success via Invidious');
    return invidiousUrl;
  }
  
  throw new Error('All streaming sources exhausted. YouTube block is too strong.');
}
