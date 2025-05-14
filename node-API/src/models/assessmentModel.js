const mongoose = require('mongoose');

const caregiverAssessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerType: {
    type: String,
    enum: ['caregiver', 'nurse', 'doctor', 'dietician'],
    default: 'caregiver'
  },
  questions: [{
    question: String,
    answer: String
  }],
  evaluation: {
    score: {
      type: Number,
      default: 0
    },
    feedback: String,
    improvements: String,
    qualificationStatus: {
      type: String,
      enum: ['qualified', 'not_qualified', 'pending'],
      default: 'pending'
    },
    rawEvaluation: String,
    date: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const CaregiverAssessment = mongoose.model('CaregiverAssessment', caregiverAssessmentSchema);

module.exports = CaregiverAssessment;
