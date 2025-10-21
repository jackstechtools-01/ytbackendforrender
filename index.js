// index.js
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 10000;

// mimic a real browser
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

// Helper: parse ytInitialPlayerResponse from page HTML
function parsePlayerResponse(html){
  let m;
  // standard embedded JSON
  m = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/s);
  if(m){ try { return JSON.parse(m[1]); } catch(e){} }

  // fallback ytplayer.config
  m = html.match(/ytplayer\.config\s*=\s*({.+?});/s);
  if(m){ 
    try { 
      const cfg = JSON.parse(m[1]); 
      if(cfg.args && cfg.args.player_response) return JSON.parse(cfg.args.player_response); 
    } catch(e){}
  }

  return null;
}

// main fetch endpoint
app.get('/fetch', async (req,res)=>{
  const { url, id } = req.query;
  let watchUrl = url || (id ? `https://www.youtube.com/watch?v=${id}` : null);

  if(!watchUrl) return res.status(400).json({error: 'Provide url or id'});

  try {
    // fetch YouTube watch page server-side
    const r = await fetch(watchUrl, { headers: {'User-Agent': USER_AGENT} });
    const html = await r.text();

    const player = parsePlayerResponse(html);

    // add CORS headers so frontend can call this anywhere
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    res.json({
      ok: true,
      watchUrl,
      player,
    });

  } catch(e){
    res.status(500).json({error: String(e)});
  }
});

// optional: simple ping endpoint
app.get('/', (req,res)=>{
  res.send('YT Fetcher is running. Use /fetch?url=<youtube_watch_url> or /fetch?id=<VIDEOID>');
});

app.listen(PORT, ()=>console.log(`Render YT Fetcher running on port ${PORT}`));
