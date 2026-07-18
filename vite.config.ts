import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import searchHandler from './api/search';
import chatHandler from './api/chat';

function apiDevMiddleware() {
  return {
    name: 'api-dev-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url?.split('?')[0];
        if (url !== '/api/search' && url !== '/api/chat') {
          return next();
        }

        // Parse JSON body if POST
        let body: any = {};
        if (req.method === 'POST') {
          await new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk: any) => data += chunk);
            req.on('end', () => {
              try { body = JSON.parse(data); } catch (e) {}
              resolve(null);
            });
          });
        }
        req.body = body;

        // Polyfill res.status and res.json for Vercel functions
        res.status = (code: number) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data: any) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return res;
        };

        try {
          if (url === '/api/search') {
            await searchHandler(req, res);
          } else if (url === '/api/chat') {
            await chatHandler(req, res);
          }
        } catch (err: any) {
          console.error('API middleware error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Server error' }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), apiDevMiddleware()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
