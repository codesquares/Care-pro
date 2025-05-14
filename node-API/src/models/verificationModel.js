const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verificationType: {
    type: String,
    enum: ['nin', 'bvn', 'drivers_license', 'passport', 'voter_id', 'address', 'selfie'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'expired'],
    default: 'pending'
  },
  verificationData: {
    // Store verification response data
    type: mongoose.Schema.Types.Mixed
  },
  referenceId: {
    type: String
  },
  verificationDate: {
    type: Date,
    default: Date.now
  }
});

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;
