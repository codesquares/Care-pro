// Mock withdrawal controller
module.exports = {
  withdrawFunds: jest.fn((req, res) => res.status(200).json({ status: 'success' })),
  
  // requestWithdrawal: jest.fn((req, res) => res.status(200).json({ status: 'success' })),
  
  // updateWithdrawal: jest.fn((req, res) => res.status(200).json({ status: 'success' }))
};
