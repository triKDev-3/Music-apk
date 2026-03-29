import express from "express";
import { initDatabase, getCachedSearch, setCachedSearch } from "../server/db.js";
import "dotenv/config";

const app = express();
app.use(express.json());

// YouTube Search API
app.get("/api/search/youtube", async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    // Try to init DB on demand if needed
    await initDatabase();
    
    const cached = await getCachedSearch(query, "search_cache");
    if (cached) return res.json(cached);

    const { default: ytSearchModule } = await import("yt-search") as any;
    const yt_search = ytSearchModule.default || ytSearchModule;
    
    console.log(`[YouTube Search - API Lambda] Querying: ${query}`);
    const r = await yt_search(query);
    const results = r.videos.slice(0, 15).map((item: any) => ({
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
    console.error("[YouTube Search - API Lambda] Error:", error.message);
    res.status(500).json({ error: "Search failed on serverless function", details: error.message });
  }
});

// Stream Redirect Proxy
app.get("/api/stream", async (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).send("ID is required");

  try {
    const { default: ytdl } = await import("@distube/ytdl-core");
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${id}`);
    const format = ytdl.chooseFormat(info.formats, { 
      filter: "audioonly",
      quality: "highestaudio"
    });

    if (format && format.url) {
      return res.redirect(format.url);
    }
    throw new Error("No suitable format found");
  } catch (error: any) {
    console.error("[Stream - API Lambda] Extraction failed:", error.message);
    res.status(500).send(`Stream extraction failed: ${error.message}`);
  }
});

export default app;
