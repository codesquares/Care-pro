const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientServiceRequest',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['accepted', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'accepted'
  },
  scheduledTimes: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    notes: String
  }],
  paymentDetails: {
    amount: Number,
    currency: {
      type: String,
      default: 'NGN'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid', 'refunded', 'disputed'],
      default: 'pending'
    },
    paymentMethod: String,
    paymentId: String
  },
  taskBreakdown: [{
    task: String,
    description: String,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending'
    },
    completedAt: Date,
    notes: String
  }],
  clientRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: Date
  },
  providerRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: Date
  },
  disputeDetails: {
    reason: String,
    description: String,
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved_for_client', 'resolved_for_provider', 'closed'],
    },
    resolvedAt: Date,
    resolution: String
  },
  notes: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
gigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Gig = mongoose.model('Gig', gigSchema);

module.exports = Gig;
