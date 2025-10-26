// Mock dojah verification controller
module.exports = {
  // Mock all exports as Jest mocks
  handleDojahWebhook: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ message: 'Webhook received' });
  }),
  handleGetDojahWebhook: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ message: 'Webhook GET endpoint' });
  }),
  saveVerificationData: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ message: 'Verification data saved' });
  }),
  getWebhookData: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ data: {} });
  }),
  processWebhookData: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ processed: true });
  }),
  processWebhookToAzure: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ processed: true });
  }),
  retryAzureSubmission: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ retried: true });
  }),
  getVerificationStatus: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ status: 'verified' });
  }),
  getAllWebhookData: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ data: [] });
  }),
  getWebhookStatistics: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ stats: {} });
  }),
  getWebhookSystemHealth: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ health: 'good' });
  }),
  verifyPhone: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ verified: true });
  }),
  verifyEmail: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ verified: true });
  }),
  verifyBVN: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ verified: true });
  }),
  processVerification: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ processed: true });
  })
};
