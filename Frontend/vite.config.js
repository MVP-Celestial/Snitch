import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // if any request comes from browser to the vite server with "/api" in the url then it is forwarded to Backend localhost3000
        changeOrigin: true,
        secure: false // allows http along with https
      }
    } //vite servers run in development only DO NOT run in production 
  }
})
