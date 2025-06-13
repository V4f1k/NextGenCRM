import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      port: 5173,
    },
  },
  optimizeDeps: {
    // Force pre-bundling of drag-drop libraries to avoid import issues
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'lucide-react',
      'clsx',
      'zod',
      '@hookform/resolvers',
      'react-hook-form',
      // Drag and drop libraries - critical for Docker compatibility
      '@dnd-kit/core',
      '@dnd-kit/sortable', 
      '@dnd-kit/utilities',
      'react-dnd',
      'react-dnd-html5-backend',
      '@atlaskit/pragmatic-drag-and-drop',
      '@atlaskit/pragmatic-drag-and-drop-hitbox'
    ],
    force: true, // Force rebuild to clear cache issues after Docker restart
  },
  build: {
    // Reduce chunk size warnings for drag-drop libraries
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['lucide-react', '@headlessui/react'],
          'drag-drop': [
            '@dnd-kit/core',
            '@dnd-kit/sortable', 
            '@dnd-kit/utilities',
            'react-dnd',
            'react-dnd-html5-backend',
            '@atlaskit/pragmatic-drag-and-drop',
            '@atlaskit/pragmatic-drag-and-drop-hitbox'
          ]
        }
      }
    }
  }
})
