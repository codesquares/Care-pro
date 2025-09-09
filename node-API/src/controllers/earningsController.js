const axios = require('axios');
const { generateEarnings } = require('../services/earnings');

const earningsRequest = async (req, res) => {
  if (!req.user){
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }

  // Handle null or undefined request body
  if (!req.body) {
    return res.status(400).json({
      status: 'error',
      message: 'caregiverId, totalEarned and token are all required'
    });
  }

  const { caregiverId, totalEarned, token } = req.body;
  if (!caregiverId || !totalEarned || !token){
    return res.status(400).json({
      status: 'error',
      message: 'caregiverId, totalEarned and token are all required'
    });
  }

  try {
    const result = await generateEarnings({ caregiverId, totalEarned, token });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = {
  earningsRequest
}