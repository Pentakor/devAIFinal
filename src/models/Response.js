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
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending'
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
responseSchema.index({ status: 1, createdAt: -1 });
responseSchema.index({ 'metadata.submissionTime': -1 });

// Instance methods
responseSchema.methods.isValid = function () {
  return this.status === 'approved';
};

responseSchema.methods.approve = async function (notes) {
  if (this.status === 'approved') throw new Error('Response is already approved');
  this.status = 'approved';
  if (notes) this.validationNotes = notes;
  return this.save();
};

responseSchema.methods.reject = async function (notes) {
  if (this.status === 'rejected') throw new Error('Response is already rejected');
  if (!notes) throw new Error('Rejection notes are required');
  this.status = 'rejected';
  this.validationNotes = notes;
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
  return this.find({ status: 'pending' })
    .populate('survey', 'area question')
    .populate('user', 'username email')
    .sort({ createdAt: 1 });
};

// Middleware
responseSchema.pre('save', async function (next) {
  if (this.isModified('status')) {
    const Survey = mongoose.model('Survey');
    const survey = await Survey.findById(this.survey);
    if (!survey || !survey.isActive()) {
      return next(new Error('Cannot modify response for closed or expired survey'));
    }
  }
  next();
});

responseSchema.pre('validate', async function (next) {
  try {
    const Survey = mongoose.model('Survey');
    const User = mongoose.model('User');

    const survey = await Survey.findById(this.survey);
    if (!survey || !survey.isActive()) this.invalidate('survey', 'Survey must be active');

    const user = await User.findById(this.user);
    if (!user || !user.isActive) this.invalidate('user', 'User must be active');

    if (this.content && survey?.guidelines?.permittedDomains?.length > 0) {
      const regex = new RegExp(survey.guidelines.permittedDomains.join('|'), 'i');
      if (!regex.test(this.content)) {
        this.invalidate('content', 'Response content must match permitted domains');
      }
    }

    if (this.isModified('status') && !survey?.isActive()) {
      this.invalidate('status', 'Cannot change status for closed or expired surveys');
    }

    next();
  } catch (err) {
    next(err);
  }
});

const Response = mongoose.model('Response', responseSchema);
export default Response;
