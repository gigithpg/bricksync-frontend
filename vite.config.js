import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 8080,
  },
  css: {
    postcss: {
      plugins: [require('tailwindcss')({ config: './tailwind.config.js' }), require('autoprefixer')]
    }
  }
});