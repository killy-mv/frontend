import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // This proxy is what makes case 1 a *same-site* API. The browser only ever
    // talks to localhost:5173, so /api/* is same-origin: cookies ride along with
    // no CORS, no `credentials: 'include'`, no configuration at all.
    proxy: {
      '/api': { target: 'http://localhost:8787' },
    },
  },
})
