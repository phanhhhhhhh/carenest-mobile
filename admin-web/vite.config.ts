import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies /api to the Spring Boot backend. The browser only ever
// talks to localhost:5174, so requests are same-origin and carry no Origin header
// (or one equal to Host) — Spring never classifies them as CORS.
// Do NOT set changeOrigin: it rewrites the forwarded Host to the target, so the
// backend then sees Origin (localhost:5174) != Host (localhost:8082) and rejects
// the request as an invalid CORS request against `cors.allowed-origins`.
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
