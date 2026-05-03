import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],

  server: {
    port: 3000,
    host: true, // Allow access via subdomains like wazalendosacco.localhost
    open: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
      },
      '/storage': {
        target: 'http://127.0.0.1:8000',
      },
      '/savings-groups': {
        target: 'http://127.0.0.1:8000',
      },
    },
  },
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@t': fileURLToPath(new URL('./src/tenants', import.meta.url)),
      '@c': fileURLToPath(new URL('./src/central', import.meta.url))
    },
  },

  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-vue-next')) return 'vendor-icons';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('chart.js') || id.includes('vue-chartjs')) return 'vendor-charts';
            return 'vendor'; 
          }
        }
      }
    }
  }
})
