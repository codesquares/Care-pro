import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  
  return {
  plugins: [
    react({
      jsxRuntime: 'automatic',
    })
  ],
  server: {
    proxy: {
      // Proxy all API requests - environment aware
      '/api': {
        target: env.VITE_API_URL?.replace('/api', '') || env.VITE_AZURE_API_URL?.replace('/api', '') || 'https://api.oncarepro.com',
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
      
      // TODO: Switch to production when ready
      // '/api': {
      //   target: 'https://oncarepro.com',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // WebSocket proxying for real-time notifications - environment aware
      '/notificationHub': {
        target: env.VITE_NOTIFICATION_HUB_URL || 'https://carepro-api20241118153443.azurewebsites.net',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      },
      
      // TODO: Switch to production when ready
      // '/notificationHub': {
      //   target: 'https://oncarepro.com',
      //   changeOrigin: true,
      //   secure: false,
      //   ws: true,
      // },

      // Proxy for identity verification API - environment aware
      '/identity-api': {
        target: env.VITE_IDENTITY_API_URL || 'https://budmfp9jxr.us-east-1.awsapprunner.com',
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
  }
})
