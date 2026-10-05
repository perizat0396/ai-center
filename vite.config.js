import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  // относительные пути: сайт работает и локально, и на GitHub Pages (perizat0396.github.io/ai-center/)
  base: './',
  build: {
    // многостраничный сайт: каждая HTML-страница — отдельная точка входа
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about.html'),
      },
    },
  },
});
