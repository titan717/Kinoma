import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const MOVIE_API = "https://apikinoma.vercel.app";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Helper proxy handler
  async function proxyHandler(targetPath: string, req: express.Request, res: express.Response) {
    try {
      const queryString = new URLSearchParams(req.query as any).toString();
      const url = `${MOVIE_API}${targetPath}${queryString ? '?' + queryString : ''}`;
      const r = await fetch(url);
      const data = await r.json();
      res.status(r.status).json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // Health
  app.get(['/api/health', '/health'], (req, res) => proxyHandler('/api/v1/health', req, res));

  // Search
  app.get(['/api/search', '/api/anime/search', '/search'], (req, res) => proxyHandler('/api/v1/search', req, res));
  app.get(['/api/search/:query', '/api/anime/search/:query'], (req, res) => {
    req.query.q = req.params.query;
    proxyHandler('/api/v1/search', req, res);
  });

  // Trending & Popular (aliased to search)
  app.get(['/api/trending', '/api/anime/trending', '/trending'], async (req, res) => {
    try {
      const r = await fetch(`${MOVIE_API}/api/v1/trending?window=day`);
      const data = await r.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get(['/api/popular', '/api/anime/popular', '/popular'], async (req, res) => {
    try {
      const r = await fetch(`${MOVIE_API}/api/v1/popular/tv?page=1`);
      const data = await r.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Info
  app.get(['/api/info/:id', '/info/:id'], (req, res) => proxyHandler(`/api/v1/tv/${req.params.id}`, req, res));

  // Episodes
  app.get(['/api/episodes/:id', '/episodes/:id'], (req, res) => proxyHandler(`/api/v1/tv/${req.params.id}/episodes`, req, res));

  // Servers
  app.get(['/api/servers/:id/:ep', '/servers/:id/:ep'], (req, res) => proxyHandler(`/api/v1/tv/${req.params.id}/season/1/episode/${req.params.ep}/sources`, req, res));

  // Stream
  app.get(['/api/stream/:id/:ep', '/stream/:id/:ep'], (req, res) => proxyHandler(`/api/v1/tv/${req.params.id}/season/1/episode/${req.params.ep}/play`, req, res));

  // Schedule
  app.get(['/api/schedule', '/schedule'], (req, res) => proxyHandler('/api/v1/airing/today', req, res));

  // Android TV Self-Update JSON endpoint (maps to latest.json)
  app.get(['/tv/update.json', '/update/latest.json'], (req, res) => {
    const latestJsonPath = path.join(process.cwd(), 'update', 'latest.json');
    if (fs.existsSync(latestJsonPath)) {
      res.setHeader('Content-Type', 'application/json');
      return res.sendFile(latestJsonPath);
    }
    res.json({
      versionCode: 1,
      versionName: '1.0.0',
      apkUrl: 'https://github.com/titan717/Kinoma/releases/latest/download/Kinoma.apk',
      releaseNotes: 'Initial release of Kinoma Native Android TV App.',
      mandatory: false,
      sha256: 'PENDING'
    });
  });

  // Serve downloads statically and via custom handler BEFORE vite middleware
  app.use('/downloads', express.static(path.join(process.cwd(), 'public', 'downloads')));

  // Explicit Android TV APK download endpoint (supports GitHub Releases proxy or local binary)
  app.get('/downloads/Kinoma.apk', async (req, res) => {
    const filePath = path.join(process.cwd(), 'public', 'downloads', 'Kinoma.apk');
    if (fs.existsSync(filePath)) {
      return res.download(filePath, 'Kinoma.apk', {
        headers: {
          'Content-Type': 'application/vnd.android.package-archive',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }, (err) => {
        if (err && !res.headersSent) {
          res.status(404).send('APK file not found');
        }
      });
    }
    res.redirect('https://github.com/titan717/Kinoma/releases/latest/download/Kinoma.apk');
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
