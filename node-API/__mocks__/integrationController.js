// Mock integration controller
module.exports = {
  // Mock all exports as Jest mocks
  getUserVerificationStatus: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ status: 'verified' });
  }),
  testIntegration: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ message: 'Integration test successful' });
  }),
  getIntegrationStatus: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ status: 'active' });
  }),
  configureIntegration: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ message: 'Integration configured' });
  })
};
