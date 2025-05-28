import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
// import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    basicSsl({
      /** name of certification */
      name: "test",
      /** custom trust domains */
      domains: ["localhost"],
      /** custom certification directory */
      certDir: ".devServer/cert",
    }),
  ],
  server: {
    proxy: {
      "/api": "http://risureader.top:8080",
    },
  },
});
