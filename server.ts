import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ytdl from '@distube/ytdl-core';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000; // Render utilise souvent le port 3000 ou 10000

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.status(200).send('OK'));

/**
 * Extraction Audio avec agent utilisateur simulé pour éviter le 429
 */
app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id as string;
  if (!videoId) return res.status(400).json({ error: 'Video ID required' });

  try {
    console.log(`[Stream] Nouveau test pour: ${videoId}`);

    // CONFIGURATION ANTI-BLOCAGE
    const options = {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      }
    };

    const info = await ytdl.getInfo(videoId, options);
    
    // On force la recherche des formats audio uniquement
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highestaudio',
      filter: 'audioonly'
    });

    if (format && format.url) {
      console.log(`[Success] Flux extrait pour ${videoId}`);
      // On envoie l'URL au client (le téléphone)
      return res.json({ url: format.url });
    }
    
    throw new Error('No audio format available');

  } catch (error: any) {
    console.error(`[Error 429/Fail] ${error.message}`);
    
    // Si YouTube nous bloque (429), on tente une redirection vers un proxy public en dernier recours
    const fallback = `https://inv.vern.cc/latest_version?id=${videoId}&itag=140`;
    console.log(`[Fallback] Redirection vers Invidious proxy...`);
    res.json({ url: fallback });
  }
});

app.listen(port, () => {
  console.log(`[Server] Antigravity Engine running on port ${port}`);
});
