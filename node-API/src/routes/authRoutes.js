const express = require('express');
const {
  login,
  getMe,
  updateProfile,
  verifyUser
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/verify-user', verifyUser);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/update-profile', protect, updateProfile);

module.exports = router;
