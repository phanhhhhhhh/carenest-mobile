import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies /api to the Spring Boot backend so the browser stays
// same-origin (no CORS config needed for local work). Override the target with
// VITE_API_TARGET when the backend runs elsewhere.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
});
