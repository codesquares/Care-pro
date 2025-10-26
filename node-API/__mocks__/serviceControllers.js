// Mock service controllers

const webhookController = {
  handleWebhook: jest.fn((req, res) => res.status(200).json({ status: 'success' }))
};

module.exports = {
  webhookController
};
