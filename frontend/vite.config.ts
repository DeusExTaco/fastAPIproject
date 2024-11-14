// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  css: {
    preprocessorOptions: {
      tailwindcss: {
        config: './tailwind.config.js',
      },
    },
  },
  worker: {
    format: 'es',
    plugins: () => [],
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: '[name].js',
      },
    },
  },
  build: {
    target: 'esnext',
  },
});