// Mock authController
const verifyUser = jest.fn((req, res) => {
  const { email, firstName, lastName } = req.body;
  
  // Validate required fields
  if (!email || !firstName || !lastName) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: email, firstName, lastName'
    });
  }
  
  // Simulate external API call result
  if (email === 'test@example.com') {
    return res.status(200).json({
      status: 'success',
      user: {
        id: 'user123',
        email: email,
        firstName: firstName,
        lastName: lastName
      }
    });
  }
  
  return res.status(404).json({
    status: 'error',
    message: 'User not found'
  });
});

const updateUserVerificationStatus = jest.fn(async (userId, statusUpdate) => {
  if (!userId || typeof userId !== 'string') {
    return { success: false, error: 'Invalid user ID' };
  }
  
  return { success: true, message: 'Status updated' };
});

module.exports = {
  verifyUser,
  updateUserVerificationStatus
};
