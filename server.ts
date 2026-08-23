import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const RAILWAY_API = "https://reanimeto-api-production-46bf.up.railway.app";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Helper proxy handler
  async function proxyHandler(targetPath: string, req: express.Request, res: express.Response) {
    try {
      const queryString = new URLSearchParams(req.query as any).toString();
      const url = `${RAILWAY_API}${targetPath}${queryString ? '?' + queryString : ''}`;
      const r = await fetch(url);
      const data = await r.json();
      res.status(r.status).json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // Health
  app.get(['/api/health', '/health'], (req, res) => proxyHandler('/health', req, res));

  // Search
  app.get(['/api/search', '/search'], (req, res) => proxyHandler('/search', req, res));

  // Trending & Popular (aliased to search)
  app.get(['/api/trending', '/trending'], async (req, res) => {
    try {
      const r = await fetch(`${RAILWAY_API}/search?q=action&limit=20&offset=0`);
      const data = await r.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get(['/api/popular', '/popular'], async (req, res) => {
    try {
      const r = await fetch(`${RAILWAY_API}/search?q=adventure&limit=20&offset=0`);
      const data = await r.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Info
  app.get(['/api/info/:id', '/info/:id'], (req, res) => proxyHandler(`/info/${req.params.id}`, req, res));

  // Episodes
  app.get(['/api/episodes/:id', '/episodes/:id'], (req, res) => proxyHandler(`/episodes/${req.params.id}`, req, res));

  // Servers
  app.get(['/api/servers/:id/:ep', '/servers/:id/:ep'], (req, res) => proxyHandler(`/servers/${req.params.id}/${req.params.ep}`, req, res));

  // Stream
  app.get(['/api/stream/:id/:ep', '/stream/:id/:ep'], (req, res) => proxyHandler(`/stream/${req.params.id}/${req.params.ep}`, req, res));

  // Schedule
  app.get(['/api/schedule', '/schedule'], (req, res) => proxyHandler('/schedule', req, res));

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
