/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from "@tailwindcss/vite";
import viteReact from '@vitejs/plugin-react';
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": "https://risureader.top",
    },
  },
  plugins: [
    tsconfigPaths(),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
