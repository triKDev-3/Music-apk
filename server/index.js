const express = require('express');
const cors = require('cors');
const ytDlp = require('yt-dlp-exec');

const app = express();
app.use(cors()); // Autorise le front-end React à s'y connecter

app.get('/stream', async (req, res) => {
    const videoId = req.query.id;
    
    if (!videoId) {
        return res.status(400).send('Précise un ID YouTube (?id=...)');
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[Stream yt-dlp] Requête pour la vidéo: ${videoId}`);

    try {
        const ytdl = require('@distube/ytdl-core');
        
        res.setHeader('Content-Type', 'audio/mpeg');
        
        console.log(`[Stream] Lancement ytdl-core pour ${videoId}`);
        
        const stream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25 // 32MB buffer
        });

        stream.pipe(res);

        stream.on('error', (err) => {
            console.error(`[ytdl-core error]`, err);
            if (!res.headersSent) res.status(500).send('Stream error');
            else res.end();
        });

        res.on('close', () => {
            console.log(`[Stream] Fermeture du flux pour ${videoId}`);
            if (stream.destroy) stream.destroy();
        });

    } catch (error) {
        console.error(`[Erreur] Impossible de lire ${videoId}:`, error.message);
        if (!res.headersSent) res.status(500).send('Erreur backend');
    }
});

const YouTube = require('youtube-sr').default;
const yts = require('yt-search');

/**
 * Endpoint de recherche robuste (Bypasse le Quota API YouTube)
 * Tente d'abord avec youtube-sr, puis bascule sur yt-search en cas d'échec.
 */
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Paramètre q manquant' });

    console.log(`[Recherche] Requête: "${query}"`);

    try {
        // Tentative 1: youtube-sr (très précis)
        try {
            const results = await YouTube.search(query, { limit: 15, type: "video" });
            if (results && results.length > 0) {
                console.log(`[Search] youtube-sr a trouvé ${results.length} titres.`);
                const tracks = results.map(v => ({
                    id: v.id,
                    title: v.title,
                    artist: v.channel?.name || 'YouTube',
                    album: 'YouTube Music',
                    coverUrl: v.thumbnail?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
                    duration: Math.floor(v.duration / 1000),
                    youtubeId: v.id
                }));
                return res.json(tracks);
            }
        } catch (e) {
            console.warn(`[Search] youtube-sr a échoué, passage au fallback...`);
        }

        // Tentative 2: yt-search (très stable)
        const results = await yts(query);
        const videos = (results.videos || []).slice(0, 15);
        
        console.log(`[Search] yt-search a trouvé ${videos.length} titres.`);
        const tracks = videos.map(v => ({
            id: v.videoId,
            title: v.title,
            artist: v.author.name || 'YouTube',
            album: 'YouTube Music',
            coverUrl: v.thumbnail || v.image,
            duration: v.seconds,
            youtubeId: v.videoId
        }));

        res.json(tracks);

    } catch (error) {
        console.error(`[Search Erreur Fatale]`, error);
        res.status(500).json({ error: 'Erreur lors de la recherche sur le serveur' });
    }
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`\n\x1b[32m🟢 PlayMe Backend en ligne !\x1b[0m`);
    console.log(`\x1b[34m➜ Streaming (yt-dlp) : http://localhost:${PORT}/stream?id=VIDEO_ID\x1b[0m`);
    console.log(`\x1b[34m➜ Recherche (Scraping) : http://localhost:${PORT}/search?q=QUERY\x1b[0m\n`);
});

// Force event loop to stay open in case of early exit bugs
setInterval(() => {}, 1000 * 60 * 60);
