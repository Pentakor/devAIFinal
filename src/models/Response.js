import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  survey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: [true, 'Survey is required'],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    minlength: [10, 'Response must be at least 10 characters long'],
    maxlength: [2000, 'Response cannot exceed 2000 characters']
  },
  validation: {
    type: String,
    enum: {
      values: ['pending', 'violation', 'approved'],
      message: '{VALUE} is not a valid validation status'
    },
    default: 'pending',
    index: true
  },
  violationExplanation: {
    type: String,
    trim: true,
    maxlength: [500, 'Violation explanation cannot exceed 500 characters'],
    validate: {
      validator: function(v) {
        // Only require explanation if validation is 'violation'
        if (this.validation === 'violation') {
          return v && v.length >= 10;
        }
        return true;
      },
      message: 'Violation explanation is required and must be at least 10 characters when validation status is violation'
    }
  },
  validationNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Validation notes cannot exceed 500 characters'],
    validate: {
      validator: function (v) {
        if (!v) return true;
        return v.length >= 5;
      },
      message: 'Validation notes must be at least 5 characters long'
    }
  },
  metadata: {
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    submissionTime: {
      type: Date,
      default: Date.now,
      validate: {
        validator: function (v) {
          return v <= new Date();
        },
        message: 'Submission time cannot be in the future'
      }
    }
  }
}, {
  timestamps: true
});

// Indexes
responseSchema.index({ survey: 1, user: 1 }, { unique: true });
responseSchema.index({ validation: 1, createdAt: -1 });
responseSchema.index({ 'metadata.submissionTime': -1 });

// Instance methods
responseSchema.methods.markAsViolation = async function(explanation) {
  if (!explanation) {
    throw new Error('Violation explanation is required');
  }
  this.validation = 'violation';
  this.violationExplanation = explanation;
  return this.save();
};

responseSchema.methods.markAsApproved = async function() {
  this.validation = 'approved';
  this.violationExplanation = undefined;
  return this.save();
};

// Static methods
responseSchema.statics.getBySurvey = function (surveyId) {
  if (!surveyId) throw new Error('Survey ID is required');
  return this.find({ survey: surveyId }).populate('user', 'username email').sort({ createdAt: -1 });
};

responseSchema.statics.getByUser = function (userId) {
  if (!userId) throw new Error('User ID is required');
  return this.find({ user: userId }).populate('survey', 'area question').sort({ createdAt: -1 });
};

responseSchema.statics.getPending = function () {
  return this.find({ validation: 'pending' })
    .populate('survey', 'area question')
    .populate('user', 'username email')
    .sort({ createdAt: 1 });
};

// Middleware
responseSchema.pre('validate', async function (next) {
  try {
    const Survey = mongoose.model('Survey');
    const User = mongoose.model('User');

    const survey = await Survey.findById(this.survey);
    if (!survey || !survey.isActive()) this.invalidate('survey', 'Survey must be active');

    const user = await User.findById(this.user);
    if (!user || !user.isActive) this.invalidate('user', 'User must be active');

    if (this.content && survey?.guidelines?.permittedDomains?.length > 0) {
      const permittedDomains = Array.isArray(survey.guidelines.permittedDomains) 
        ? survey.guidelines.permittedDomains 
        : [];
      
      if (permittedDomains.length > 0) {
        const regex = new RegExp(permittedDomains.join('|'), 'i');
        if (!regex.test(this.content)) {
          this.invalidate('content', 'Response content must match permitted domains');
        }
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

const Response = mongoose.model('Response', responseSchema);
export default Response;
