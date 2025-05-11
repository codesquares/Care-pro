import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://carepro-api20241118153443.azurewebsites.net', // Target backend API URL
        changeOrigin: true,  // Ensures the correct "origin" header is sent with the request
        secure: false,       // Disable SSL verification if needed
        // rewrite: (path) => path.replace(/^\/api/, ''), // Rewrite the path, if necessary
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/variables.scss";`
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@components': resolve(__dirname, 'src/components'),
      '@features': resolve(__dirname, 'src/main-app/features')
    }
  }
})
