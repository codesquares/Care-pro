const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
// const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const kycRoutes = require('./src/routes/kycRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const clientServiceRoutes = require('./src/routes/clientServiceRoutes');
const providerServiceRoutes = require('./src/routes/providerServiceRoutes');
const assessmentRoutes = require('./src/routes/assessmentRoutes');
const withdrawalRoutes = require('./src/routes/withdrawalRoutes');

// Load environment variables
dotenv.config();

// Process command line arguments for port override
const args = process.argv.slice(2);
let portArg;

// Check for --port flag in command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--port=')) {
    portArg = parseInt(args[i].split('=')[1], 10);
    break;
  }
}

const app = express();
// Priority: 1. Command line arg, 2. Environment variable, 3. Default 3000
const PORT = portArg || process.env.PORT || 3000;

// Middleware
app.use(cors());
// Increase JSON payload limit to accommodate larger image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  // Skip logging for verification status checks to reduce console clutter
  if (req.originalUrl.indexOf('/api/kyc/status') === -1) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Test endpoint for payload size testing
app.post('/test-payload', (req, res) => {
  console.log(`Received payload of size: ${JSON.stringify(req.body).length / (1024 * 1024)} MB`);
  res.json({ 
    success: true, 
    message: 'Large payload received successfully',
    payloadSize: `${Math.round((JSON.stringify(req.body).length / (1024 * 1024)) * 100) / 100} MB`
  });
});

// Setup webhook raw body parser before other middlewares
app.use('/webhook/webhook', express.raw({ type: 'application/json' }));

// Import integration routes
const integrationRoutes = require('./src/routes/integrationRoutes');
const recommendationRoutes = require('./src/routes/recommendationRoutes');
const { apiKeyAuth } = require('./src/middleware/apiKeyMiddleware');
const earningsRoutes = require('./src/routes/earningsRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/client-services', clientServiceRoutes);
app.use('/api/provider-services', providerServiceRoutes);
app.use('/api/integration', apiKeyAuth, integrationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/earnings',earningsRoutes);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is healthy',
    endpoints: {
      kyc: {
        verification: [
          '/api/kyc/verify-bvn',
          '/api/kyc/verify-nin', 
          '/api/kyc/verify-id-selfie',
          '/api/kyc/verify-bvn-with-id-selfie',
          '/api/kyc/verify-nin-with-selfie',
          '/api/kyc/status'
        ]
      }
    }
  });
});

// Home route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to the Care-Pro API',
    status: 'Online',
    version: '1.0.0'
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Something went wrong on the server'
  });
});

// Start server with auto port fallback
const startServer = (port) => {
  const server = app.listen(port)
    .on('listening', () => {
      console.log(`✅ Server running on http://localhost:${port}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} is busy, trying port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  
  return server;
};

startServer(PORT);