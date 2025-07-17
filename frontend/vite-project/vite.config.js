import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all API requests including notifications with detailed logging
      '/api': {
        target: 'https://carepro-api20241118153443.azurewebsites.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log(`Proxying API request: ${path}`);
          return path;
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
            // Try to send a more friendly error to client
            if (!res.headersSent && req.url.includes('/api/Notifications')) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                items: [],
                totalCount: 0,
                currentPage: 1,
                pageSize: 10,
                error: "API proxy error"
              }));
            }
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
      },

      // Proxy for identity verification API (care-pro-node-api)
      '/identity-api': {
        target: 'https://care-pro-node-api.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/identity-api/, '/api'),
      },

    },
    host: 'localhost', // Safer default; avoid exposing dev server to network
    fs: {
      deny: ['.env', '.env.local', '.git', 'node_modules'], // Deny sensitive folders explicitly
    },
    strictPort: false, // Ensures the server will not start if the port is already in use
  },
  preview:{
    host: 'localhost',
    port: process.env.PORT || 5173,
    strictPort: false,
    allowedHosts: 'all'
  },
  esbuild: {
    legalComments: 'none',
  },
  build: {
    sourcemap: false, // avoid eval-based source maps
  },
})
