import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
    survey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Survey',
        required: [true, 'Survey is required'],
        index: true,
        validate: {
            validator: async function(v) {
                const Survey = mongoose.model('Survey');
                const survey = await Survey.findById(v);
                return survey && survey.isActive();
            },
            message: 'Survey must be active'
        }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
        index: true,
        validate: {
            validator: async function(v) {
                const User = mongoose.model('User');
                const user = await User.findById(v);
                return user && user.isActive;
            },
            message: 'User must be active'
        }
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        trim: true,
        minlength: [10, 'Response must be at least 10 characters long'],
        maxlength: [2000, 'Response cannot exceed 2000 characters'],
        validate: {
            validator: async function(v) {
                const Survey = mongoose.model('Survey');
                const survey = await Survey.findById(this.survey);
                
                // Check if content matches permitted domains
                const domainRegex = new RegExp(survey.guidelines.permittedDomains.join('|'), 'i');
                return domainRegex.test(v);
            },
            message: 'Response content must match permitted domains'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'approved', 'rejected'],
            message: '{VALUE} is not a valid status'
        },
        default: 'pending',
        validate: {
            validator: function(v) {
                // Can't change status if survey is closed or expired
                if (this.isModified('status')) {
                    const Survey = mongoose.model('Survey');
                    return Survey.findById(this.survey).then(survey => {
                        return survey && survey.isActive();
                    });
                }
                return true;
            },
            message: 'Cannot change status for closed or expired surveys'
        }
    },
    validationNotes: {
        type: String,
        trim: true,
        maxlength: [500, 'Validation notes cannot exceed 500 characters'],
        validate: {
            validator: function(v) {
                // Only validate if validation notes are provided
                if (!v) return true;
                return v.length >= 5;
            },
            message: 'Validation notes must be at least 5 characters long'
        }
    },
    metadata: {
        ipAddress: {
            type: String,
            trim: true
        },
        userAgent: {
            type: String,
            trim: true
        },
        submissionTime: {
            type: Date,
            default: Date.now,
            validate: {
                validator: function(v) {
                    return v <= new Date();
                },
                message: 'Submission time cannot be in the future'
            }
        }
    }
}, {
    timestamps: true
});

// Compound index for efficient querying
responseSchema.index({ survey: 1, user: 1 }, { unique: true });
responseSchema.index({ status: 1, createdAt: -1 });
responseSchema.index({ 'metadata.submissionTime': -1 });

// Method to check if response is valid
responseSchema.methods.isValid = function() {
    return this.status === 'approved';
};

// Method to approve response
responseSchema.methods.approve = async function(notes) {
    if (this.status === 'approved') {
        throw new Error('Response is already approved');
    }
    this.status = 'approved';
    if (notes) {
        this.validationNotes = notes;
    }
    return this.save();
};

// Method to reject response
responseSchema.methods.reject = async function(notes) {
    if (this.status === 'rejected') {
        throw new Error('Response is already rejected');
    }
    if (!notes) {
        throw new Error('Rejection notes are required');
    }
    this.status = 'rejected';
    this.validationNotes = notes;
    return this.save();
};

// Static method to get responses by survey
responseSchema.statics.getBySurvey = function(surveyId) {
    if (!surveyId) {
        throw new Error('Survey ID is required');
    }
    return this.find({ survey: surveyId })
        .populate('user', 'username email')
        .sort({ createdAt: -1 });
};

// Static method to get responses by user
responseSchema.statics.getByUser = function(userId) {
    if (!userId) {
        throw new Error('User ID is required');
    }
    return this.find({ user: userId })
        .populate('survey', 'area question')
        .sort({ createdAt: -1 });
};

// Static method to get pending responses
responseSchema.statics.getPending = function() {
    return this.find({ status: 'pending' })
        .populate('survey', 'area question')
        .populate('user', 'username email')
        .sort({ createdAt: 1 });
};

// Pre-save middleware to validate response state
responseSchema.pre('save', async function(next) {
    if (this.isModified('status')) {
        const Survey = mongoose.model('Survey');
        const survey = await Survey.findById(this.survey);
        if (!survey || !survey.isActive()) {
            next(new Error('Cannot modify response for closed or expired survey'));
            return;
        }
    }
    next();
});

const Response = mongoose.model('Response', responseSchema);

export default Response; 