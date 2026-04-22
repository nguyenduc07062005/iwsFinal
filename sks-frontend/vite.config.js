import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('mermaid')) {
            return 'mermaid'
          }

          if (
            id.includes('react-router-dom') ||
            id.includes('react-dom') ||
            id.includes('/react/')
          ) {
            return 'react'
          }

          return undefined
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
})
