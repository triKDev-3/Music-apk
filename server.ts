import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { initDatabase, getCachedSearch, setCachedSearch, isUsingMemoryCache } from "./server/db.js";
import "dotenv/config";
import { spawn } from "child_process";
import ytSearch from "yt-search";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initDatabase();

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const app = express();
const PORT = process.env.PORT || 3000;

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

  console.log(`[Stream] Requesting stream for: ${id}`);
  
  try {
    const { default: ytdl } = await import("@distube/ytdl-core");
    const url = `https://www.youtube.com/watch?v=${id}`;
    
    // On Vercel, we try to get the direct URL to avoid the 10s timeout
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { 
      filter: "audioonly",
      quality: "highestaudio"
    });

    if (format && format.url) {
      console.log(`[Stream] Redirecting to direct URL for: ${id}`);
      return res.redirect(format.url);
    }

    throw new Error("No suitable format found");
  } catch (error: any) {
    console.error("[Stream] Extraction failed:", error.message);
    if (process.env.VERCEL) {
      return res.status(500).send("Stream extraction failed on Vercel");
    }
    
    // Fallback locally only
    console.log(`[Stream] Fallback vers yt-dlp pour: ${id}`);
    const ytDlp = spawn("yt-dlp", [
      "-f", "bestaudio",
      "-g",
      "--quiet",
      "--no-playlist",
      `https://www.youtube.com/watch?v=${id}`
    ]);

    let streamUrl = "";
    ytDlp.stdout.on("data", (data) => streamUrl += data.toString());
    ytDlp.on("close", (code) => {
      if (code === 0 && streamUrl.trim()) {
        res.redirect(streamUrl.trim());
      } else {
        if (!res.headersSent) res.status(500).send("Stream fallback failed");
      }
    });
  }
});

// YouTube Search API
app.get("/api/search/youtube", async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: "Query is required" });

  const cached = await getCachedSearch(query, "search_cache");
  if (cached) {
    console.log(`[Cache Hit] YouTube: ${query}`);
    return res.json(cached);
  }

  try {
    const r = await ytSearch(query);
    const videos = r.videos.slice(0, 20);
    const results = videos.map(item => ({
      id: item.videoId,
      title: item.title,
      artist: item.author.name,
      album: "YouTube Video",
      coverUrl: item.thumbnail,
      duration: item.seconds,
      youtubeId: item.videoId,
      source: "youtube"
    }));

    await setCachedSearch(query, results, "search_cache");
    res.json(results);
  } catch (error: any) {
    console.error("[YouTube Search] Error:", error.message);
    res.status(500).json({ error: "Search failed", details: error.message });
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
    res.status(500).json({ error: error.message || "Failed to search via Gemini" });
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
