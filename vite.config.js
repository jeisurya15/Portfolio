import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      // Keep the large libraries in their own long-cacheable chunks.
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (
            /node_modules\/(react|react-dom|scheduler|motion|framer-motion|motion-dom)\//.test(id)
          )
            return 'ui';
        },
      },
    },
  },
});
