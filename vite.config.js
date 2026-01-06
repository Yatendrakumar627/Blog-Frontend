import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mantine-vendor': ['@mantine/core', '@mantine/hooks', '@mantine/form', '@mantine/notifications'],
          'tiptap-vendor': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-link', '@tiptap/extension-text-align'],
          'db-vendor': ['@tanstack/react-query', 'axios', 'zustand']
        }
      }
    }
  }
})
