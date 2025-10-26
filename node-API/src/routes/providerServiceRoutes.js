const express = require('express');
const router = express.Router();

// Placeholder route for provider services
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Provider service routes available' });
});

module.exports = router;
