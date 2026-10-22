import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'spotify-and-image-proxy',
      configureServer(server) {
        server.middlewares.use('/api/spotify-embed', async (req, res) => {
          try {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const type = urlObj.searchParams.get('type') || 'album';
            const id = urlObj.searchParams.get('id') || '';
            if (!id) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing Spotify ID' }));
              return;
            }

            const embedUrl = `https://open.spotify.com/embed/${encodeURIComponent(type)}/${encodeURIComponent(id)}`;
            const response = await fetch(embedUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml',
              },
            });

            if (!response.ok) {
              res.statusCode = response.status;
              res.end(JSON.stringify({ error: `Spotify embed returned ${response.status}` }));
              return;
            }

            const html = await response.text();
            const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
            if (!match || !match[1]) {
              res.statusCode = 422;
              res.end(JSON.stringify({ error: 'Could not parse __NEXT_DATA__ from Spotify embed' }));
              return;
            }

            const nextData = JSON.parse(match[1]);
            const entity = nextData?.props?.pageProps?.state?.data?.entity;
            if (!entity) {
              res.statusCode = 422;
              res.end(JSON.stringify({ error: 'No entity found in Spotify embed payload' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ entity }));
          } catch (err: unknown) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown proxy error' }));
          }
        });

        server.middlewares.use('/api/image-proxy', async (req, res) => {
          try {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const targetUrl = urlObj.searchParams.get('url');
            if (!targetUrl) {
              res.statusCode = 400;
              res.end('Missing url param');
              return;
            }
            const imgRes = await fetch(targetUrl);
            if (!imgRes.ok) {
              res.statusCode = imgRes.status;
              res.end('Failed to fetch image');
              return;
            }
            const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
            const arrayBuffer = await imgRes.arrayBuffer();
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.end(Buffer.from(arrayBuffer));
          } catch {
            res.statusCode = 500;
            res.end('Image proxy error');
          }
        });
      },
    },
  ],
});
