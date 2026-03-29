import express from "express";

const app = express();
app.use(express.json());

// YouTube Search API
app.get("/api/search/youtube", async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    console.log(`[Lambda Search] Query: ${query}`);
    
    // Dynamic import inside the handler to avoid module load crashes
    const ytSearchModule: any = await import("yt-search");
    const yt_search = ytSearchModule.default || ytSearchModule;
    
    if (typeof yt_search !== 'function') {
        throw new Error("yt-search module is not a function");
    }

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

    res.json(results);
  } catch (error: any) {
    console.error("[Lambda Search] Error:", error.message);
    res.status(500).json({ error: "YouTube Search failed", details: error.message });
  }
});

// YouTube Stream Proxy
app.get("/api/stream", async (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).send("ID is required");

  // Keep track of attempts
  console.log(`[Lambda Stream] Request for ID: ${id}`);

  try {
    const ytdlModule: any = await import("@distube/ytdl-core");
    const ytdl = ytdlModule.default || ytdlModule;
    
    const url = `https://www.youtube.com/watch?v=${id}`;
    
    // Some videos are restricted. Try with basic headers.
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      }
    });

    const format = ytdl.chooseFormat(info.formats, { 
      filter: "audioonly",
      quality: "highestaudio"
    });

    if (format && format.url) {
      console.log(`[Lambda Stream] Success - Redirecting to stream URL`);
      // Vercel might have issues with long redirects. Use 302.
      return res.status(302).redirect(format.url);
    }
    
    throw new Error("No suitable format found");
  } catch (error: any) {
    console.error("[Lambda Stream] Extraction failed:", error.message);
    // Return detailed error for debugging in console
    res.status(500).json({ 
      error: "Stream extraction failed", 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// App Dashboard Stats (Mock for now to stabilize)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

export default app;
