import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Mirrors production proxyUrl="/__clerk" for local dev (middleware only runs on Vercel).
    proxy: {
      "/__clerk": {
        target: "https://frontend-api.clerk.dev",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__clerk/, ""),
      },
    },
  },
});
