import { defineConfig } from 'vite';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'dist-electron',
    lib: {
      entry: {
        main: path.resolve(__dirname, 'electron/main.ts'),
        preload: path.resolve(__dirname, 'electron/preload.ts')
      },
      formats: ['es']
    },
    rollupOptions: {
      external: [
        'electron',
        'electron-squirrel-startup',
        'electron-serve',
        'node:path',
        'node:url'
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    emptyOutDir: true,
    minify: false // Keep it readable for debugging
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  define: {
    'process.env': process.env
  }
});