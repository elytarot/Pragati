// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy /api calls to backend in dev (avoids CORS issues)
      "/api": {
        target:      "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir:       "dist",
    sourcemap:    false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ["react", "react-dom"],
          charts:   ["recharts"],
          router:   ["react-router-dom"],
        },
      },
    },
  },
});
