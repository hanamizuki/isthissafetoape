import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react(), ],
  // node_modules is a symlink into /opt/baku-templates — keep Vite's dep
  // cache (default: node_modules/.vite) co-located with the project instead
  // of writing through the symlink into the template tree.
  cacheDir: './.vite',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
