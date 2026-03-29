import express from "express";

const app = express();

// API Root log
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.url}`);
  next();
});

// YouTube Search API (Barebone Test)
app.get("/api/search/youtube", (req, res) => {
  const query = req.query.q;
  console.log(`[API Search] Query: ${query}`);
  res.json([
    {
      id: "api-test-id",
      title: `Résultat Test: ${query}`,
      artist: "Système de secours",
      album: "Mode Maintenance",
      coverUrl: "https://picsum.photos/300",
      duration: 300,
      youtubeId: "dQw4w9WgXcQ",
      source: "youtube"
    }
  ]);
});

// Catch-all to see what Vercel passes
app.use("*", (req, res) => {
  res.json({ error: "Route non trouvée sur la Lambda", url: req.url, path: req.path });
});

export default app;
