const express = require('express');
const router = express.Router();

// Placeholder route for client services
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Client service routes available' });
});

module.exports = router;
