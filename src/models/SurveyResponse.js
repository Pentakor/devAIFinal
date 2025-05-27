const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
    surveyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Survey',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: [10, 'Response must be at least 10 characters long'],
        maxlength: [2000, 'Response cannot exceed 2000 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        submissionTime: {
            type: Date,
            default: Date.now
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
surveyResponseSchema.index({ surveyId: 1, createdAt: -1 });
surveyResponseSchema.index({ status: 1 });

// Method to approve response
surveyResponseSchema.methods.approve = async function() {
    this.status = 'approved';
    return this.save();
};

// Method to reject response
surveyResponseSchema.methods.reject = async function() {
    this.status = 'rejected';
    return this.save();
};

// Static method to get responses for a survey
surveyResponseSchema.statics.getBySurvey = function(surveyId) {
    return this.find({ surveyId: surveyId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema); 