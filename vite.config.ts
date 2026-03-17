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
})
