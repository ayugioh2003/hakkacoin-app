import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/hakkacoin-app/',
  plugins: [vue(), tailwindcss()],
  server: {
    allowedHosts: ['.trycloudflare.com']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
