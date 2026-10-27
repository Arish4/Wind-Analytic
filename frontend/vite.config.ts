import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Recharts (with its React peer) is one ~550 kB vendor chunk that browsers cache separately.
    chunkSizeWarningLimit: 600,
    rollupOptions: { output: { manualChunks: { charts: ["recharts"] } } },
  },
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8010" },
  },
});
