// Mock webhook controller
module.exports = {
  // Mock all exports as Jest mocks
  processWebhook: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ message: 'Webhook processed' });
  }),
  getWebhookEvents: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ events: [] });
  }),
  verifyWebhook: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ verified: true });
  })
};
