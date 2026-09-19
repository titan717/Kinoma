import express from 'express';
import path from 'path';
import fs from 'fs';
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

  // Android TV Self-Update JSON endpoint
  app.get('/tv/update.json', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.get('host') || 'ais-dev-ldac4dfys5uh24kepg3akw-880382000432.asia-east1.run.app';
    res.json({
      latestVersionCode: 1,
      latestVersionName: '1.0.0',
      apkUrl: `${protocol}://${host}/downloads/Kinoma-TV.apk`,
      releaseNotes: 'Initial release of Kinoma Native Android TV App with ExoPlayer and Leanback support.',
      mandatory: false
    });
  });

  // Explicit Android TV APK download endpoint with correct mime type and headers
  app.get('/downloads/Kinoma-TV.apk', async (req, res) => {
    const filePath = path.join(process.cwd(), 'public', 'downloads', 'Kinoma-TV.apk');
    
    // Check if local file exists in repo code
    if (fs.existsSync(filePath)) {
      return res.download(filePath, 'Kinoma-TV.apk', {
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

    // Fallback to external URL if configured
    const externalUrl = process.env.APK_DOWNLOAD_URL;
    if (externalUrl) {
      try {
        const response = await fetch(externalUrl);
        if (response.ok && response.body) {
          res.setHeader('Content-Type', 'application/vnd.android.package-archive');
          res.setHeader('Content-Disposition', 'attachment; filename="Kinoma-TV.apk"');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
          return;
        }
      } catch (e) {
        // Ignore error
      }
    }

    res.status(404).send('Kinoma-TV.apk not found in repository or external source');
  });

  // Serve downloads statically as fallback
  app.use('/downloads', express.static(path.join(process.cwd(), 'public', 'downloads')));

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
