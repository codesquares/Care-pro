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

// Load environment variables
dotenv.config();



const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  // Skip logging for verification status checks to reduce console clutter
  if (req.originalUrl.indexOf('/api/kyc/status') === -1) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Setup webhook raw body parser before other middlewares
app.use('/webhook/webhook', express.raw({ type: 'application/json' }));

// Import integration routes
const integrationRoutes = require('./src/routes/integrationRoutes');
const recommendationRoutes = require('./src/routes/recommendationRoutes');
const { apiKeyAuth } = require('./src/middleware/apiKeyMiddleware');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/client-services', clientServiceRoutes);
app.use('/api/provider-services', providerServiceRoutes);
app.use('/api/integration', apiKeyAuth, integrationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/assessment', assessmentRoutes);

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});