import express from 'express';
import ytdl from 'ytdl-core';

const app = express();
const PORT = process.env.PORT || 10000;

// CORS so frontend can access it from Google Sites
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// simple ping route
app.get('/', (req, res) => {
  res.send('YT Downloader backend running!');
});

// fetch YouTube formats
app.get('/fetch', async (req, res) => {
  const { url, id } = req.query;
  const videoUrl = url || (id ? `https://www.youtube.com/watch?v=${id}` : null);

  if (!videoUrl) return res.status(400).json({ error: 'Provide a YouTube URL or ID' });

  try {
    // fetch video info via ytdl-core
    const info = await ytdl.getInfo(videoUrl);

    // get all audio+video formats
    const formats = ytdl.filterFormats(info.formats, 'audioandvideo');

    // simplify the data for frontend
    const simplified = formats.map(f => ({
      quality: f.qualityLabel || f.audioQuality || 'Unknown',
      mimeType: f.mimeType,
      url: f.url
    }));

    res.json({
      ok: true,
      title: info.videoDetails.title,
      formats: simplified
    });

  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => console.log(`Render YT Downloader running on port ${PORT}`));
