import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { warnStack } from "../scripts/stack-versions.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(root, "..");
const apiPort = Number(process.env.CLAY_API_PORT || 4174);

export default defineConfig({
  plugins: [
    react(),
    {
      name: "clay-stack-versions",
      configureServer() {
        if (process.env.CLAY_STACK_CHECKED === "1") return;
        void warnStack(appRoot);
      },
    },
  ],
  root,
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    port: 4173,
    proxy: { "/v1": `http://127.0.0.1:${apiPort}` },
  },
});
