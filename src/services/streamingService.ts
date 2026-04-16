import { CapacitorHttp, Capacitor } from '@capacitor/core';

/**
 * Universal Fetch
 * Uses Capacitor Native HTTP on mobile to bypass CORS, and standard fetch on web.
 */
async function universalFetch(url: string, options: any = {}): Promise<any> {
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.request({
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      data: options.data,
    });
    return {
      ok: res.status >= 200 && res.status < 300,
      json: async () => res.data,
      status: res.status,
      url: res.url
    };
  } else {
    return fetch(url, options);
  }
}

/**
 * Primary Method: Our Render Backend
 */
async function getBackendStream(youtubeId: string): Promise<string | null> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (!apiUrl) return null;

    console.log(`[Streaming] Trying Backend: ${apiUrl}`);
    const targetUrl = `${apiUrl}/api/stream?id=${youtubeId}`;
    
    // On mobile, the redirect might need to be followed manually or handled by native
    // But usually a GET request to /api/stream will return a 302 or the data
    const res = await universalFetch(targetUrl);
    
    if (res.ok) {
        const data = await res.json();
        return data.url || null;
    }
    return null;
  } catch (err) {
    console.warn('[Streaming] Backend failed:', err);
    return null;
  }
}

/**
 * Fallback 1: Cobalt
 */
async function getCobaltStream(youtubeId: string): Promise<string | null> {
  try {
    const targetUrl = 'https://api.cobalt.tools/api/json';
    const response = await universalFetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: {
        url: `https://www.youtube.com/watch?v=${youtubeId}`,
        downloadMode: 'audio',
        audioFormat: 'mp3',
        filenamePattern: 'pretty'
      }
    });
    
    const data = await response.json();
    if (data.status === 'redirect' || data.status === 'stream') {
      return data.url;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Fallback 2: Piped
 */
async function getPipedStream(youtubeId: string): Promise<string | null> {
  const PIPED_INSTANCES = ['https://pipedapi.kavin.rocks', 'https://pipedapi.rimgo.lol', 'https://piped-api.lunar.icu'];
  const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
  const isWeb = !Capacitor.isNativePlatform() && typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  
  for (const instance of PIPED_INSTANCES) {
    try {
      const targetUrl = `${instance}/streams/${youtubeId}`;
      const fetchUrl = isWeb ? `${CORS_PROXY}${encodeURIComponent(targetUrl)}` : targetUrl;
      
      const response = await universalFetch(fetchUrl);
      if (!response.ok) continue;
      
      const data = await response.json();
      const audioStream = data.audioStreams?.find((s: any) => s.format === 'M4A' || s.format === 'WEB_M');
      return audioStream?.url || data.audioStreams?.[0]?.url || null;
    } catch (err) {
      continue;
    }
  }
  return null;
}

/**
 * Main Entry Point
 */
export async function getClientStreamUrl(youtubeId: string): Promise<string> {
  console.log(`[Streaming] Global Fetch for: ${youtubeId}`);
  
  // 1. BACKEND (RENDER) - BEST
  const backendUrl = await getBackendStream(youtubeId);
  if (backendUrl) return backendUrl;

  // 2. COBALT - SECOND BEST
  const cobaltUrl = await getCobaltStream(youtubeId);
  if (cobaltUrl) return cobaltUrl;
  
  // 3. PIPED - LAST RESORT
  const pipedUrl = await getPipedStream(youtubeId);
  if (pipedUrl) return pipedUrl;
  
  throw new Error('All streaming sources exhausted.');
}
