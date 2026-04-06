import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'src',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'electron',
        '@electron/remote',
        'better-sqlite3',
        'path',
        'fs',
        'child_process',
        'os',
        'url',
        'events',
        'util',
        'stream',
        'crypto',
        'net',
        'tls',
        'http',
        'https',
      ],
      output: {
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Bridge to existing Mailspring modules
      'mailspring-exports': path.resolve(__dirname, 'src/lib/mailspring-exports.ts'),
    },
  },
  server: {
    // Dev server for HMR during development
    port: 5173,
  },
});
