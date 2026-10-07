import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "client",
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    proxy: {
      "/api": "http://127.0.0.1:3001",
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    allowedHosts: true,
  },
});
