import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root,
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    port: 4173,
    proxy: { "/v1": "http://127.0.0.1:4174" },
  },
});
