// Mock auth middleware
module.exports = {
  protect: jest.fn().mockImplementation((req, res, next) => {
    req.user = { id: 'test-user-id', role: 'user' };
    next();
  }),
  protectAdmin: jest.fn().mockImplementation((req, res, next) => {
    req.user = { id: 'test-admin-id', role: 'admin' };
    next();
  })
};
