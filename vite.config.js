import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // The lazy assistant talks to Ollama running on this computer. Going through the dev
      // server avoids CORS, and "/ollama/api/chat" becomes "http://localhost:11434/api/chat".
      '/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, ''),
      },
      // The Doomscroll reels player talks to the local Python reels server (reels-server/app.py).
      '/reels-api': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/reels-api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      // The dance detector uses MoveNet only; see the stub for why.
      '@mediapipe/pose': fileURLToPath(
        new URL('./src/features/dance/mediapipePoseStub.js', import.meta.url),
      ),
    },
  },
});
