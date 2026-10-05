import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Многостраничный сайт: каждая HTML-страница — отдельная точка входа
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about.html'),
      },
    },
  },
});
