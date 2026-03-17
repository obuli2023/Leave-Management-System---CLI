import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/cli-leave-application-portal/',
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    outDir: '../Backend/wwwroot',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/cli-leave-application-portal/api': {
        target: 'http://localhost:5242',
        changeOrigin: true,
      }
    }
  }
})
