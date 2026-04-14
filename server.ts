import express from "express";

import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { initDatabase, getCachedSearch, setCachedSearch, isUsingMemoryCache } from "./server/db";
import "dotenv/config";
import { spawn } from "child_process";
import yts from "yt-search";
import YTMusic from "ytmusic-api";


initDatabase();

const ytmusic = new YTMusic();
ytmusic.initialize().catch(console.error);

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.VERCEL ? "vercel" : "local" });
});

// YouTube Search Fallback using yt-dlp (No API key needed)
app.get("/api/yt-search", async (req, res) => {
  const q = req.query.q as string;
  if (!q) return res.status(400).send("Query is required");

  // Vercel Check: yt-dlp won't be available
  if (process.env.VERCEL) {
    return res.status(503).json({ error: "Fallback search via yt-dlp is not available on Vercel. Please provide a YouTube API Key." });
  }

  console.log(`[YT-Search] Recherche fallback via yt-dlp pour: ${q}`);
  
  const ytDlp = spawn("yt-dlp", [
    "ytsearch20:" + q,
    "--dump-json",
    "--no-playlist",
    "--flat-playlist"
  ]);

  let output = "";
  ytDlp.stdout.on("data", (data) => output += data.toString());
  
  ytDlp.on("close", (code) => {
    try {
      const lines = output.trim().split("\n").filter(l => l.trim().length > 0);
      const results = lines.map(line => {
        try {
          const item = JSON.parse(line);
          return {
            id: `yt-${item.id}`,
            title: item.title,
            artist: item.uploader || 'YouTube',
            album: 'YouTube Music',
            coverUrl: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
            duration: item.duration || 0,
            youtubeId: item.id,
            source: 'youtube'
          };
        } catch { return null; }
      }).filter(r => !!r);
      
      res.json({ items: results });
    } catch (err) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  ytDlp.on("error", (err) => {
    console.error("[YT-Search] Error:", err);
    res.status(500).json({ error: "Search failed" });
  });
});

// Spotify Token Proxy (Nouvelle Fonctionnalité)
app.get("/api/spotify/token", async (req, res) => {
  const CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.VITE_SPOTIFY_CLIENT_SECRET;
  
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: "Spotify credentials not set in environment" });
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      },
      body: 'grant_type=client_credentials',
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Spotify token" });
  }
});

// YouTube Stream Proxy (Optimisé via ytdl-core)
app.get("/api/stream", async (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).send("ID is required");

  console.log(`[Stream] Streaming via ytdl-core pour: ${id}`);
  
  const startYtDlpFallback = () => {
    console.log(`[Stream] Fallback vers yt-dlp pour: ${id}`);
    const ytDlp = spawn("yt-dlp", [
      "-f", "bestaudio",
      "-g",
      "--quiet",
      "--no-playlist",
      `https://www.youtube.com/watch?v=${id}`
    ]);

    let streamUrl = "";
    ytDlp.stdout.on("data", (data) => {
      streamUrl += data.toString();
    });

    ytDlp.on("close", (code) => {
      if (code === 0 && streamUrl.trim()) {
        res.redirect(streamUrl.trim());
      } else {
        if (!res.headersSent) res.status(500).send("Stream fallback extraction failed");
      }
    });

    ytDlp.on("error", (err) => {
      console.error("[Stream] yt-dlp non disponible ou erreur:", err);
      if (!res.headersSent) res.status(500).send("Stream extraction failed");
    });

    req.on("close", () => {
      ytDlp.kill();
    });
  };

  try {
    const { default: ytdl } = await import("@distube/ytdl-core");
    const url = `https://www.youtube.com/watch?v=${id}`;
    
    const stream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25
    });
    
    let hasError = false;
    stream.on("error", (err) => {
      console.error(`[ytdl-core error]`, err);
      hasError = true;
      if (!res.headersSent) {
        startYtDlpFallback();
      } else {
        res.end();
      }
    });

    stream.on("info", () => {
      if (!hasError) {
        res.setHeader("Content-Type", "audio/mpeg");
        stream.pipe(res);
      }
    });

    req.on("close", () => {
      if (stream.destroy) stream.destroy();
    });
  } catch (error) {
    console.error("[Stream] Échec initialisation ytdl-core:", error);
    startYtDlpFallback();
  }
});

// PipedAPI Proxy avec rotation d'instances pour une fiabilité maximale
app.get("/api/piped-streams/:id", async (req, res) => {
  const { id } = req.params;
  res.setHeader('Access-Control-Allow-Origin', '*');

  const instances = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.privacydev.net",
    "https://pipedapi.leptons.xyz"
  ];

  for (const instance of instances) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${instance}/streams/${id}`, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' },
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      if (response.ok) {
        const data = await response.json();
        if (data && data.audioStreams && data.audioStreams.length > 0) return res.json(data);
      }
    } catch (err) { /* Instance failed, next... */ }
  }
  res.status(503).json({ error: "Service temporarily unavailable" });
});

// YouTube Search API
app.get("/api/search/youtube", async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: "Query is required" });

  const cached = await getCachedSearch(query, "search_cache");
  if (cached) return res.json(cached);

  try {
    console.log(`[YouTube Search] High-speed search for: "${query}"`);
    const r = await yts(query);
    const results = (r.videos || [])
      .slice(0, 20)
      .map((v: any) => ({
        id: v.videoId,
        title: v.title,
        artist: v.author.name || 'Unknown Artist',
        album: 'YouTube',
        coverUrl: v.thumbnail || v.image,
        duration: v.seconds || 0,
        youtubeId: v.videoId,
        source: 'youtube'
      }));
    
    if (results.length > 0) {
      await setCachedSearch(query, results, "search_cache");
      return res.json(results);
    }
    throw new Error("NO_RESULTS");
  } catch (error: any) {
    console.warn(`[YouTube Search] Fallback to Google API or Gemini...`);
    // Fallback to Google API if key present
    const API_KEY = (process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || "").trim();
    if (API_KEY && API_KEY !== "YOUR_YOUTUBE_API_KEY") {
      try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${API_KEY}`);
        if (response.ok) {
          const data = await response.json();
          return res.json((data.items || []).map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            coverUrl: item.snippet.thumbnails.high?.url,
            youtubeId: item.id.videoId,
            source: "youtube"
          })));
        }
      } catch (e) {}
    }
    
    try {
      const r = await yts(query);
      const results = (r.videos || [])
        .slice(0, 20)
        .map((v: any) => ({
          id: v.videoId,
          title: v.title,
          artist: v.author.name || 'Unknown Artist',
          album: 'YouTube',
          coverUrl: v.thumbnail || v.image,
          duration: v.seconds || 0,
          youtubeId: v.videoId,
          source: 'youtube'
        }));
      
      if (results.length > 0) {
        console.log(`[YouTube Search] Success with yt-search: ${results.length} results`);
        await setCachedSearch(query, results, "search_cache");
        return res.json(results);
      }

      // If yt-search also fails or returns nothing, try Gemini as a last resort in the backend
      console.log(`[YouTube Search] yt-search returned nothing, trying Gemini fallback...`);
      const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
      if (GEMINI_KEY && GEMINI_KEY !== "YOUR_GEMINI_API_KEY") {
        const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
        const model = ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Find 10 real YouTube music videos for the query: "${query}". Return ONLY a JSON array: [{"title": "...", "artist": "...", "youtubeId": "..."}]`,
          config: { responseMimeType: "application/json" }
        });
        const geminiRes = await model;
        const geminiData = JSON.parse(geminiRes.text || "[]");
        const geminiResults = geminiData.map((t: any) => ({
          id: t.youtubeId,
          title: t.title,
          artist: t.artist,
          album: "AI Recommendation",
          coverUrl: `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg`,
          duration: 180,
          youtubeId: t.youtubeId,
          source: "youtube"
        }));
        if (geminiResults.length > 0) {
          await setCachedSearch(query, geminiResults, "search_cache");
          return res.json(geminiResults);
        }
      }
      
      res.json([]); 
    } catch (fallbackError: any) {
      console.error("[YouTube Search] All fallbacks failed:", fallbackError.message);
      res.json([]); 
    }
  }
});

// Gemini Search API
app.post("/api/search/gemini", async (req, res) => {
  const { query, type = "search" } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  const cacheKey = `${type}:${query}`;
  const cached = await getCachedSearch(cacheKey, "gemini_cache");
  if (cached) {
    console.log(`[Cache Hit] Gemini (${type}): ${query}`);
    return res.json(cached);
  }

  const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY") {
    return res.status(401).json({ error: "Gemini API key is missing or invalid. Please set GEMINI_API_KEY." });
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    let contents = "";
    if (type === "search") {
      contents = `Search for music tracks matching: "${query}". Return a list of 5 tracks with their title, artist, album, a placeholder cover image URL (using picsum.photos), an estimated duration in seconds, and a likely YouTube ID.`;
    } else if (type === "mood") {
      contents = `Suggest 10 popular songs for a "${query}" mood. Return a list of tracks with title, artist, album, coverUrl (picsum.photos), duration, and youtubeId.`;
    } else if (type === "smart") {
      contents = `Generate a playlist of 10 songs based on this prompt: "${query}". Return a list of tracks with title, artist, album, coverUrl (picsum.photos), duration, and youtubeId.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              album: { type: Type.STRING },
              coverUrl: { type: Type.STRING },
              duration: { type: Type.NUMBER },
              youtubeId: { type: Type.STRING },
            },
            required: ["title", "artist", "album", "coverUrl", "duration", "youtubeId"],
          },
        },
      },
    });

    const text = response.text;
    if (text) {
      const results = JSON.parse(text).map((t: any) => ({
        id: `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: t.title,
        artist: t.artist,
        album: t.album,
        thumbnail: t.coverUrl,
        duration: t.duration,
        youtubeId: t.youtubeId,
        source: "youtube",
      }));
      
      await setCachedSearch(cacheKey, results, "gemini_cache");
      return res.json(results);
    }
    res.json([]);
  } catch (error: any) {
    console.error("Gemini search full error:", error);
    res.json([]);
  }
});

// Gemini Audio Recognition API
app.post("/api/recognize", async (req, res) => {
  const { base64Audio, mimeType } = req.body;
  if (!base64Audio || !mimeType) return res.status(400).json({ error: "Audio data is required" });

  const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY") {
    return res.status(401).json({ error: "Gemini API key is missing or invalid. Please set GEMINI_API_KEY." });
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          {
            text: 'Listen to this audio clip and identify the song. Return ONLY a JSON object with "title" and "artist" properties. If you cannot identify it, return an empty JSON object.',
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (text) {
      try {
        const result = JSON.parse(text);
        if (result.title && result.artist) {
          return res.json({ result: `${result.title} - ${result.artist}` });
        } else if (result.title) {
          return res.json({ result: result.title });
        }
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
      }
    }
    res.json({ result: "Unknown" });
  } catch (error) {
    console.error("Error recognizing audio:", error);
    res.status(500).json({ error: "Failed to recognize audio" });
  }
});

// Gemini Lyrics API
app.post("/api/lyrics", async (req, res) => {
  const { track } = req.body;
  if (!track) return res.status(400).json({ error: "Track is required" });

  const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY") {
    return res.status(401).json({ error: "Gemini API key is missing or invalid. Please set GEMINI_API_KEY." });
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write the lyrics for the song "${track.title}" by "${track.artist}". Format it as a simple text with line breaks. If you don't know the exact lyrics, provide a poetic interpretation or a placeholder text.`,
    });
    res.json({ lyrics: response.text || "Lyrics not found." });
  } catch (error) {
    console.error("Error getting lyrics:", error);
    res.status(500).json({ error: "Failed to get lyrics" });
  }
});

// Serve frontend in production (except on Vercel which handles it)
if (!process.env.VERCEL) {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`
🚀 Server is running!
--------------------------------------------------
📡 URL: http://localhost:${PORT}
🌍 Mode: ${process.env.NODE_ENV || 'development'}
📦 Environment: ${process.env.VERCEL ? 'Vercel' : 'Local/Container'}
🗄️  Database: ${isUsingMemoryCache() ? 'Memory Cache (Fallback)' : 'PostgreSQL (Neon)'}
🔑 YouTube API: ${!!(process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY) ? 'Configured' : 'Missing'}
🔑 Gemini API: ${!!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) ? 'Configured' : 'Missing'}
--------------------------------------------------
    `);
  });
}

export default app;
