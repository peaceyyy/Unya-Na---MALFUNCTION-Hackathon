import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // The dance detector uses MoveNet only; see the stub for why.
      '@mediapipe/pose': fileURLToPath(
        new URL('./src/features/dance/mediapipePoseStub.js', import.meta.url),
      ),
    },
  },
});
