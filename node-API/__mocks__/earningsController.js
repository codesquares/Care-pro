// Mock earningsController
const earningsRequest = jest.fn((req, res) => {
  const { userId, amount, description } = req.body;
  
  // Validate required fields
  if (!userId || !amount) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: userId, amount'
    });
  }
  
  // Simulate earnings request processing
  return res.status(200).json({
    status: 'success',
    requestId: 'earnings_12345',
    message: 'Earnings request submitted successfully',
    amount: amount,
    status: 'pending'
  });
});

const getEarningsHistory = jest.fn((req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID is required'
    });
  }
  
  return res.status(200).json({
    status: 'success',
    earnings: [
      { id: 'earnings_1', amount: 100, date: '2023-01-01', status: 'completed' },
      { id: 'earnings_2', amount: 250, date: '2023-01-15', status: 'pending' }
    ]
  });
});

const getTotalEarnings = jest.fn(async (userId) => {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }
  
  return {
    success: true,
    totalEarnings: 1500,
    pendingEarnings: 250,
    completedEarnings: 1250
  };
});

module.exports = {
  earningsRequest,
  getEarningsHistory,
  getTotalEarnings
};
