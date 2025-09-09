const express = require('express');
const router = express.Router();

// Placeholder route for recommendations
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Recommendation routes available' });
});

module.exports = router;
