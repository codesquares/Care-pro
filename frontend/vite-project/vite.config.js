import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Keep general API proxy for other endpoints
      '/api': {
        target: 'https://carepro-api20241118153443.azurewebsites.net',
        changeOrigin: true,
        secure: false,
        bypass: (req) => {
          // Skip proxying notification requests since we're handling them directly
          if (req.url.includes('/api/Notifications')) {
            console.log('Bypassing proxy for notification request:', req.url);
            return req.url;
          }
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
      // Keep WebSocket proxying for real-time notifications
      '/notificationHub': {
        target: 'https://carepro-api20241118153443.azurewebsites.net',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      }
    },
    host: true, // Allows access from other devices on the network
    strictPort: false, // Ensures the server will not start if the port is already in use

  },
  preview:{
    host: '0.0.0.0',
    port: process.env.PORT || 5173,
    strictPort: false,
    allowedHosts: 'all'
  }
})
