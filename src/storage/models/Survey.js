import mongoose from 'mongoose';

const surveySchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    area: {
        type: String,
        required: true,
        trim: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    guidelines: {
        permittedDomains: [{
            type: String,
            required: true
        }],
        permittedResponses: {
            type: String,
            required: true
        },
        summaryInstructions: {
            type: String,
            required: true
        }
    },
    expiryDate: {
        type: Date,
        required: true
    },
    isClosed: {
        type: Boolean,
        default: false
    },
    summary: {
        content: String,
        isVisible: {
            type: Boolean,
            default: false
        },
        lastUpdated: Date
    },
    responses: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Index for text search
surveySchema.index({ area: 'text', question: 'text' });

const Survey = mongoose.model('Survey', surveySchema);

export default Survey; 