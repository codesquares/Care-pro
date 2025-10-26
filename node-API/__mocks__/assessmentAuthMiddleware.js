// Mock assessment auth middleware
module.exports = jest.fn().mockImplementation((req, res, next) => {
  req.user = { id: 'test-user-id', role: 'user' };
  next();
});
