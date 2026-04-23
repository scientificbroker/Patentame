import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: GEMINI_API_KEY is no longer injected here.
// It lives exclusively in .env.local (dev) and Vercel env vars (prod),
// accessed only by the serverless function at api/chat.ts.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
