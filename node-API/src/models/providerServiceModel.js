const mongoose = require('mongoose');

const providerServiceSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  serviceTypes: [{
    type: String,
    enum: ['basic_care', 'medical_care', 'specialized_care', 'therapy', 'nutritional_support', 'mobility_assistance', 'companionship'],
    required: true
  }],
  serviceDescription: {
    type: String,
    required: [true, 'Service description is required']
  },
  skills: [{
    name: {
      type: String,
      required: true
    },
    yearsExperience: Number,
    certifications: [String]
  }],
  serviceTags: [{
    type: String,
    trim: true
  }],
  providerType: {
    type: String,
    enum: ['caregiver', 'nurse', 'doctor', 'dietician'],
    required: true
  },
  availability: {
    // General availability preferences
    schedule: [{
      dayOfWeek: {
        type: Number, // 0 = Sunday, 1 = Monday, etc.
        required: true
      },
      startTime: {
        type: String, // Format: "HH:MM" in 24-hour format
        required: true
      },
      endTime: {
        type: String, // Format: "HH:MM" in 24-hour format
        required: true
      }
    }],
    // Specific dates when provider is unavailable
    unavailableDates: [{
      startDate: Date,
      endDate: Date,
      reason: String
    }],
    // Maximum number of clients provider can serve simultaneously
    maxConcurrentClients: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  serviceArea: {
    center: {
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
      min: 1
    }
  },
  pricing: {
    hourlyRate: {
      type: Number,
      required: true,
      min: 0
    },
    minimumHours: {
      type: Number,
      default: 1,
      min: 1
    },
    currency: {
      type: String,
      default: 'NGN'
    },
    specialRates: [{
      serviceType: String,
      rate: Number,
      conditions: String
    }]
  },
  reviews: [{
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
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
providerServiceSchema.index({ 'serviceArea.center': '2dsphere' });

// Calculate average rating before saving
providerServiceSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
  }
  
  this.updatedAt = Date.now();
  next();
});

const ProviderService = mongoose.model('ProviderService', providerServiceSchema);

module.exports = ProviderService;
