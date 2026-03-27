import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite Database
const dbPath = process.env.VERCEL ? path.join("/tmp", "cache.db") : path.join(__dirname, "cache.db");
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS search_cache (
    query TEXT PRIMARY KEY,
    results TEXT,
    timestamp INTEGER
  );
  CREATE TABLE IF NOT EXISTS gemini_cache (
    query TEXT PRIMARY KEY,
    results TEXT,
    timestamp INTEGER
  );
`);

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Helper functions for cache
const getCachedSearch = (query: string, table: string) => {
  const stmt = db.prepare(`SELECT * FROM ${table} WHERE query = ?`);
  const row = stmt.get(query) as any;
  if (row) {
    if (Date.now() - row.timestamp < CACHE_EXPIRY) {
      return JSON.parse(row.results);
    } else {
      db.prepare(`DELETE FROM ${table} WHERE query = ?`).run(query);
    }
  }
  return null;
};

const setCachedSearch = (query: string, results: any, table: string) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ${table} (query, results, timestamp)
    VALUES (?, ?, ?)
  `);
  stmt.run(query, JSON.stringify(results), Date.now());
};

const app = express();
const PORT = Number(process.env.PORT) || 3001;

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

// YouTube Stream Proxy (Nouvelle Fonctionnalité)
app.get("/api/stream", (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).send("ID is required");

  // Vercel Check: yt-dlp won't be available
  if (process.env.VERCEL) {
    console.warn(`[Stream] Stream proxy not available on Vercel for ${id}`);
    // On peut renvoyer une erreur 503 ou essayer de rediriger vers un service tiers
    return res.status(503).json({ error: "Stream extraction via yt-dlp is not available on Vercel." });
  }

  console.log(`[Stream] Extraction URL audio pour: ${id}`);
  
  const ytDlp = spawn("yt-dlp", [
    "-f", "bestaudio",
    "-g", // -g means "Get URL" (don't download, just print the direct stream URL)
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
      console.log(`[Stream] URL générée avec succès, redirection de l'utilisateur !`);
      res.redirect(streamUrl.trim());
    } else {
      console.error(`[Stream] yt-dlp a échoué à générer l'URL (code: ${code})`);
      if (!res.headersSent) res.status(500).send("Stream URL extraction failed");
    }
  });

  req.on("close", () => {
    ytDlp.kill();
  });
});

// YouTube Search API
app.get("/api/search/youtube", async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: "Query is required" });

  const cached = getCachedSearch(query, "search_cache");
  if (cached) {
    console.log(`[Cache Hit] YouTube: ${query}`);
    return res.json(cached);
  }

  const API_KEY = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || "";
  if (!API_KEY || API_KEY === "YOUR_YOUTUBE_API_KEY") {
    console.warn("YouTube API key not set or is a placeholder");
    return res.status(401).json({ error: "YouTube API key is missing or invalid. Please set VITE_YOUTUBE_API_KEY." });
  }

  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${API_KEY}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("YouTube API full error:", JSON.stringify(errorData, null, 2));
      throw new Error(errorData.error?.message || "Failed to search YouTube");
    }

    const data = await response.json();
    const results = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      album: "YouTube Video",
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      duration: 0,
      youtubeId: item.id.videoId,
      source: "youtube"
    }));

    setCachedSearch(query, results, "search_cache");
    res.json(results);
  } catch (error: any) {
    console.error("YouTube search error:", error);
    res.status(500).json({ error: error.message || "Failed to search YouTube" });
  }
});

// Gemini Search API
app.post("/api/search/gemini", async (req, res) => {
  const { query, type = "search" } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  const cacheKey = `${type}:${query}`;
  const cached = getCachedSearch(cacheKey, "gemini_cache");
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
      model: "gemini-1.5-flash",
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
      
      setCachedSearch(cacheKey, results, "gemini_cache");
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
      model: "gemini-1.5-flash",
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
      model: "gemini-1.5-flash",
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
