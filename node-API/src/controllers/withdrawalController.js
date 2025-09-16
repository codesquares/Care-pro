const {generateWithdrawalRequest} = require('../services/withdrawalService');

const withdrawFunds = async (req, res) => {
  console.log("Withdrawal Request Body:", req.body);
  const { amountRequested,
  accountNumber,
  bankName,
  accountName, caregiverId} = req.body;
  
  // Extract token from Authorization header like other endpoints
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ errorMessage: "Authorization token is required." });
  }
  const token = authHeader.split(' ')[1];
  
  if (!amountRequested || !caregiverId || !accountNumber || !bankName || !accountName) {
    return res.status(400).json({ errorMessage: "All fields are required." });
  }
  try {
    const withdrawalResponse = await generateWithdrawalRequest({
      caregiverId: caregiverId,
      amountRequested: amountRequested,
      accountNumber: accountNumber,
      bankName: bankName,
      accountName: accountName,
      token: token
    });
    console.log("Withdrawal Response:", withdrawalResponse);
    return res.status(200).json({ message: "Withdrawal request submitted successfully." });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return res.status(500).json({ errorMessage: "Failed to process withdrawal request." });
  }
}


// const allWithdrawals = async (req, res) => {
//   try {
//     // Logic to fetch all withdrawal requests by a certain caregiver
//     // This could involve querying a database or an external service
//     const caregiverId = req.user.id; // Assuming you have the caregiver ID from the authenticated user
//     console.log("Caregiver ID:", caregiverId);
//     if (!caregiverId) {
//       return res.status(400).json({ errorMessage: "Caregiver ID is required." });
//     }
//     // For demonstration, let's assume we return a static list of 10 previous withdrawal requests 
//     /*
//        <td>{new Date(withdrawal.createdAt).toLocaleDateString()}</td>
//                 <td>{formatCurrency(withdrawal.amountRequested)}</td>
//                 <td>{formatCurrency(withdrawal.serviceCharge)}</td>
//                 <td>{formatCurrency(withdrawal.finalAmount)}</td>
//                 <td className={`withdrawal-status status-${withdrawal.status.toLowerCase()}`}>
//                   {withdrawal.status}
//                 </td>
//                 <td>{withdrawal.token}</td>
//     */
//     const withdrawals = [
//       { id: 1, amountRequested: 100, serviceCharge: 5, finalAmount: 95, status: "Pending", createdAt: "2023-10-01" },
//       { id: 2, amountRequested: 200, serviceCharge: 10, finalAmount: 190, status: "Completed", createdAt: "2023-09-15" },
//       { id: 3, amountRequested: 150, serviceCharge: 7.5, finalAmount: 142.5, status: "Pending", createdAt: "2023-09-10" },
//       { id: 4, amountRequested: 300, serviceCharge: 15, finalAmount: 285, status: "Completed", createdAt: "2023-08-20" },
//       { id: 5, amountRequested: 250, serviceCharge: 12.5, finalAmount: 237.5, status: "Pending", createdAt: "2023-08-05" },
//       { id: 6, amountRequested: 400, serviceCharge: 20, finalAmount: 380, status: "Completed", createdAt: "2023-07-25" },
//       { id: 7, amountRequested: 350, serviceCharge: 17.5, finalAmount: 332.5, status: "Pending", createdAt: "2023-07-10" },
//       { id: 8, amountRequested: 500, serviceCharge: 25, finalAmount: 475, status: "Completed", createdAt: "2023-06-30" },
//       { id: 9, amountRequested: 600, serviceCharge: 30, finalAmount: 570, status: "Pending", createdAt: "2023-06-15" },
//       { id: 10, amountRequested: 700, serviceCharge: 35, finalAmount: 665, status: "Completed", createdAt: "2023-05-20" }
//     ];
     
//     return res.status(200).json(withdrawals);
//   } catch (error) {
//     console.error("Error fetching withdrawals:", error);
//     return res.status(500).json({ errorMessage: "Failed to fetch withdrawal requests." });
//   }
// }

// const withdrawableAmount = async (req, res) => {
//   try {
//     // Logic to calculate the withdrawable amount for a caregiver
//     // This could involve checking their earnings, pending withdrawals, etc.
//     const caregiverId = req.user.id; // Assuming you have the caregiver ID from the authenticated user
//     if (!caregiverId) {
//       return res.status(400).json({ errorMessage: "Caregiver ID is required." });
//     }
    
//     // For demonstration, let's assume the withdrawable amount is a static value
//     const amount = 1000; // Example amount
//     return res.status(200).json({ withdrawableAmount: amount });
//   } catch (error) {
//     console.error("Error calculating withdrawable amount:", error);
//     return res.status(500).json({ errorMessage: "Failed to calculate withdrawable amount." });
//   }
// }


// Export the withdrawal controller functions
module.exports = {
  withdrawFunds
};