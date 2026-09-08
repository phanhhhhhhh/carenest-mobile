import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies /api to the Spring Boot backend. The browser only ever
// talks to localhost:5174, so requests stay same-origin — no CORS involved.
// (Do NOT set changeOrigin: it rewrites Host so the backend sees Origin != Host
// and rejects the request as an invalid CORS request.)
// Override the backend location with VITE_API_TARGET when it runs elsewhere.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:8082',
      },
    },
  },
});
