// Mock address controller
module.exports = jest.fn((req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      status: 'error',
      message: 'User is not authorized.'
    });
  }
  
  res.status(200).json({
    status: 'success',
    verified: true,
    message: 'Address verification successful'
  });
});
