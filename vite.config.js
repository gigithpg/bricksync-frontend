import { resolve } from 'path';
import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    port: 8080,
  },
  css: {
    postcss: {
      plugins: [tailwindcss('./tailwind.config.js'), autoprefixer],
    },
  },
  resolve: {
    alias: {
      '/src/js': resolve(__dirname, 'src/js'),
      '/src/assets': resolve(__dirname, 'src/assets'),
      '/dist': resolve(__dirname, 'dist'),
    },
  },
});