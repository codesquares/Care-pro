const mongoose = require('mongoose');

const clientServiceRequestSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Service title is required']
  },
  description: {
    type: String,
    required: [true, 'Service description is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  maxDistance: {
    type: Number,
    default: 20, // in kilometers
    min: 1,
    max: 100
  },
  serviceDate: {
    startDate: {
      type: Date,
      required: [true, 'Service start date is required']
    },
    endDate: Date,
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      },
      daysOfWeek: [Number], // 0 = Sunday, 1 = Monday, etc.
    }
  },
  requiredProviderTypes: [{
    type: String,
    enum: ['caregiver', 'nurse', 'doctor', 'dietician'],
  }],
  serviceTags: [{
    type: String,
    trim: true
  }],
  serviceBreakdown: [{
    task: String,
    description: String,
    estimatedTime: Number // in minutes
  }],
  status: {
    type: String,
    enum: ['open', 'matched', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  budget: {
    type: Number,
    min: 0
  },
  matchedProviders: [{
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100
    },
    priority: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['recommended', 'accepted', 'declined', 'completed'],
      default: 'recommended'
    },
    feedback: String
  }],
  aiAnalysis: {
    rawAnalysis: mongoose.Schema.Types.Mixed,
    confidenceScore: Number,
    notesForClient: String,
    notesForProvider: String
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

// Create index for geospatial queries
clientServiceRequestSchema.index({ location: '2dsphere' });

// Middleware to update the updatedAt field
clientServiceRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ClientServiceRequest = mongoose.model('ClientServiceRequest', clientServiceRequestSchema);

module.exports = ClientServiceRequest;
