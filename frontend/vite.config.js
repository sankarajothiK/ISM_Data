import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'canvg': path.resolve(__dirname, './src/utils/empty.js'),
      'html2canvas': path.resolve(__dirname, './src/utils/empty.js'),
      'dompurify': path.resolve(__dirname, './src/utils/empty.js'),
    },
  },
  build: {
    rollupOptions: {
      external: ['canvg', 'html2canvas', 'dompurify'],
    },
  },
  optimizeDeps: {
    exclude: ['canvg', 'html2canvas', 'dompurify'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
