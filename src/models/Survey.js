import mongoose from 'mongoose';

const surveySchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required'],
        index: true,
        validate: {
            validator: async function(v) {
                const User = mongoose.model('User');
                const user = await User.findById(v);
                return user && user.isActive;
            },
            message: 'Creator must be an active user'
        }
    },
    area: {
        type: String,
        required: [true, 'Area is required'],
        trim: true,
        minlength: [3, 'Area must be at least 3 characters long'],
        maxlength: [100, 'Area cannot exceed 100 characters']
    },
    question: {
        type: String,
        required: [true, 'Question is required'],
        trim: true,
        minlength: [10, 'Question must be at least 10 characters long'],
        maxlength: [1000, 'Question cannot exceed 1000 characters']
    },
    guidelines: {
        permittedDomains: {
            type: String,
            required: [true, 'Permitted domains are required'],
            trim: true,
            minlength: [2, 'Domain must be at least 2 characters'],
            maxlength: [500, 'Domain cannot exceed 500 characters']
        },
        permittedResponses: {
            type: String,
            required: [true, 'Permitted responses guidelines are required'],
            trim: true,
            minlength: [10, 'Permitted responses guidelines must be at least 10 characters long'],
            maxlength: [500, 'Permitted responses guidelines cannot exceed 500 characters']
        },
        summaryInstructions: {
            type: String,
            required: [true, 'Summary instructions are required'],
            trim: true,
            minlength: [10, 'Summary instructions must be at least 10 characters long'],
            maxlength: [500, 'Summary instructions cannot exceed 500 characters']
        }
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required'],
        validate: {
            validator: function(value) {
                const minDate = new Date();
                const maxDate = new Date();
                maxDate.setFullYear(maxDate.getFullYear() + 1); // Max 1 year from now
                return value > minDate && value <= maxDate;
            },
            message: 'Expiry date must be between now and 1 year from now'
        }
    },
    isClosed: {
        type: Boolean,
        default: false,
        validate: {
            validator: function(v) {
                // If survey is being closed, ensure it's not already expired
                if (v && this.isExpired()) {
                    return false;
                }
                return true;
            },
            message: 'Cannot close an expired survey'
        }
    },
    summary: {
        content: {
            type: String,
            trim: true,
            maxlength: [2000, 'Summary content cannot exceed 2000 characters'],
            validate: {
                validator: function(v) {
                    // Only validate if content is provided
                    if (!v) return true;
                    return v.length >= 50;
                },
                message: 'Summary content must be at least 50 characters long'
            }
        },
        isVisible: {
            type: Boolean,
            default: false,
            validate: {
                validator: function(v) {
                    // Can only be visible if there's content
                    if (v) {
                        const content = this.getUpdate ? 
                            this.getUpdate()['summary.content'] : 
                            (this.summary && this.summary.content);
                        return !!content;
                    }
                    return true;
                },
                message: 'Cannot make summary visible without content'
            }
        },
        lastUpdated: {
            type: Date,
            validate: {
                validator: function(v) {
                    return !v || v <= new Date();
                },
                message: 'Last updated date cannot be in the future'
            }
        }
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
surveySchema.index({ area: 'text', question: 'text' });
surveySchema.index({ creator: 1, createdAt: -1 });
surveySchema.index({ expiryDate: 1 });
surveySchema.index({ isClosed: 1 });
surveySchema.index({ 'guidelines.permittedDomains': 1 });
surveySchema.index({ question: 1, 'guidelines.permittedDomains': 1, 'guidelines.permittedResponses': 1, 'guidelines.summaryInstructions': 1 }, { unique: true });

// Virtual for response count
surveySchema.virtual('responseCount').get(function() {
    return this.responses ? this.responses.length : 0;
});

// Virtual for responses
surveySchema.virtual('responses', {
    ref: 'Response',
    localField: '_id',
    foreignField: 'survey'
});

// Method to check if survey is expired
surveySchema.methods.isExpired = function() {
    return new Date() > this.expiryDate;
};

// Method to check if survey is active
surveySchema.methods.isActive = function() {
    return !this.isClosed && !this.isExpired();
};

// Method to close survey
surveySchema.methods.close = async function() {
    if (this.isExpired()) {
        throw new Error('Cannot close an expired survey');
    }
    this.isClosed = true;
    return this.save();
};

// Method to update expiry date
surveySchema.methods.updateExpiry = async function(newExpiryDate) {
    const minDate = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);

    if (newExpiryDate <= minDate || newExpiryDate > maxDate) {
        throw new Error('New expiry date must be between now and 1 year from now');
    }
    this.expiryDate = newExpiryDate;
    return this.save();
};

// Method to toggle summary visibility
surveySchema.methods.toggleSummaryVisibility = async function() {
    if (!this.summary.content) {
        throw new Error('Cannot make summary visible without content');
    }
    this.summary.isVisible = !this.summary.isVisible;
    this.summary.lastUpdated = new Date();
    return this.save();
};

// Static method to get active surveys
surveySchema.statics.getActive = function() {
    return this.find({
        isClosed: false,
        expiryDate: { $gt: new Date() }
    }).sort({ expiryDate: 1 });
};

// Static method to get surveys by creator
surveySchema.statics.getByCreator = function(creatorId) {
    if (!creatorId) {
        throw new Error('Creator ID is required');
    }
    return this.find({ creator: creatorId })
        .sort({ createdAt: -1 });
};

// Static method to search surveys
surveySchema.statics.search = function(query) {
    if (!query || typeof query !== 'string') {
        throw new Error('Valid search query is required');
    }
    return this.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });
};

// Pre-save middleware to validate survey state
surveySchema.pre('save', function(next) {
    if (this.isModified('isClosed') && this.isClosed && this.isExpired()) {
        next(new Error('Cannot close an expired survey'));
    }
    next();
});

const Survey = mongoose.model('Survey', surveySchema);

export default Survey; 