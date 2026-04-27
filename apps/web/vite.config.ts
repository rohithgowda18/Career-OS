import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    jsxLocPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Event Application Tracker",
        short_name: "Event Tracker",
        description: "Track and manage your event applications with ease",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: [],
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
