import { defineConfig } from 'vite'
import { reactRouter } from "@react-router/dev/vite";
// import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";


// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    proxy: {
      '/api': "http://risureader.top:8080" 
    }
  }
})
