import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: ".",
  build: { outDir: "dist" },
  server: {
    port: 4173,
    proxy: { "/v1": "http://127.0.0.1:4174" },
  },
});
