const express = require('express');
const router = express.Router();
const { processWebhook, getWebhookEvents } = require('../controllers/webhookController');
const { configDotenv } = require('dotenv');
configDotenv();

// Process incoming webhooks
router.post('/webhook', processWebhook);

// Get webhook events for debugging
router.get('/events', getWebhookEvents);

module.exports = router;
// This file is for setting up the webhook routes