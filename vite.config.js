import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  server: {
    port: 3000,
    host: true, // expose to LAN so network URL works
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        on: {
          error(err, _req, _res) {
            if (!['ECONNRESET', 'ECONNREFUSED'].includes(err.code)) {
              console.error('[api proxy]', err.message)
            }
          }
        }
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true,
        on: {
          error(err, _req, _socket) {
            if (!['ECONNRESET', 'ECONNREFUSED'].includes(err.code)) {
              console.error('[ws proxy]', err.message)
            }
          }
        }
      },
    },
  },
});
