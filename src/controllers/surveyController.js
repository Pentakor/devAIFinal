import Survey from '../models/Survey.js';
import Response from '../models/Response.js';
import { 
    ValidationError, 
    NotFoundError, 
    AuthorizationError,
    ConflictError
} from '../utils/errors.js';

// Survey controllers
export const createSurvey = async (req, res) => {
    const survey = new Survey({
        ...req.body,
        creator: req.user.id
    });

    await survey.save();

    res.status(201).json({
        status: 'success',
        data: { survey }
    });
};

export const getSurvey = async (req, res) => {
    const survey = await Survey.findById(req.params.id)
        .populate('creator', 'username email');

    if (!survey) {
        throw new NotFoundError('Survey not found');
    }

    res.json({
        status: 'success',
        data: { survey }
    });
};

export const updateSurvey = async (req, res) => {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
        throw new NotFoundError('Survey not found');
    }

    if (survey.creator.toString() !== req.user.id && req.user.role !== 'admin') {
        throw new AuthorizationError('Not authorized to update this survey');
    }

    if (survey.isClosed) {
        throw new ConflictError('Cannot update a closed survey');
    }

    Object.assign(survey, req.body);
    await survey.save();

    res.json({
        status: 'success',
        data: { survey }
    });
};

export const deleteSurvey = async (req, res) => {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
        throw new NotFoundError('Survey not found');
    }

    if (survey.creator.toString() !== req.user.id && req.user.role !== 'admin') {
        throw new AuthorizationError('Not authorized to delete this survey');
    }

    await survey.remove();

    res.json({
        status: 'success',
        data: null
    });
};

export const listSurveys = async (req, res) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

    const surveys = await Survey.find()
        .sort({ [sort]: order === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('creator', 'username email');

    const total = await Survey.countDocuments();

    res.json({
        status: 'success',
        data: {
            surveys,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
};

export const searchSurveys = async (req, res) => {
    const { query, type = 'fuzzy' } = req.query;

    let searchQuery;
    switch (type) {
        case 'exact':
            searchQuery = {
                $or: [
                    { question: query },
                    { area: query }
                ]
            };
            break;
        case 'semantic':
            // Implement semantic search if needed
            searchQuery = {
                $text: { $search: query }
            };
            break;
        default: // fuzzy
            searchQuery = {
                $or: [
                    { question: { $regex: query, $options: 'i' } },
                    { area: { $regex: query, $options: 'i' } }
                ]
            };
    }

    const surveys = await Survey.find(searchQuery)
        .populate('creator', 'username email');

    res.json({
        status: 'success',
        data: { surveys }
    });
};

// Response controllers
export const submitResponse = async (req, res) => {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
        throw new NotFoundError('Survey not found');
    }

    if (survey.isClosed || survey.isExpired()) {
        throw new ConflictError('Survey is closed or expired');
    }

    const existingResponse = await Response.findOne({
        survey: survey._id,
        user: req.user.id
    });

    if (existingResponse) {
        throw new ConflictError('You have already submitted a response to this survey');
    }

    const response = new Response({
        survey: survey._id,
        user: req.user.id,
        content: req.body.content,
        metadata: {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            submissionTime: new Date()
        }
    });

    await response.save();

    res.status(201).json({
        status: 'success',
        data: { response }
    });
};

export const getResponse = async (req, res) => {
    const response = await Response.findById(req.params.responseId)
        .populate('user', 'username email')
        .populate('survey');

    if (!response) {
        throw new NotFoundError('Response not found');
    }

    if (response.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        throw new AuthorizationError('Not authorized to view this response');
    }

    res.json({
        status: 'success',
        data: { response }
    });
};

export const updateResponse = async (req, res) => {
    const response = await Response.findById(req.params.responseId);

    if (!response) {
        throw new NotFoundError('Response not found');
    }

    if (response.user.toString() !== req.user.id && req.user.role !== 'admin') {
        throw new AuthorizationError('Not authorized to update this response');
    }

    const survey = await Survey.findById(response.survey);
    if (survey.isClosed || survey.isExpired()) {
        throw new ConflictError('Cannot update response for a closed or expired survey');
    }

    Object.assign(response, req.body);
    await response.save();

    res.json({
        status: 'success',
        data: { response }
    });
};

export const deleteResponse = async (req, res) => {
    const response = await Response.findById(req.params.responseId);

    if (!response) {
        throw new NotFoundError('Response not found');
    }

    if (response.user.toString() !== req.user.id && req.user.role !== 'admin') {
        throw new AuthorizationError('Not authorized to delete this response');
    }

    const survey = await Survey.findById(response.survey);
    if (survey.isClosed || survey.isExpired()) {
        throw new ConflictError('Cannot delete response for a closed or expired survey');
    }

    await response.remove();

    res.json({
        status: 'success',
        data: null
    });
};

export const listResponses = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const survey = await Survey.findById(req.params.id);
    if (!survey) {
        throw new NotFoundError('Survey not found');
    }

    if (survey.creator.toString() !== req.user.id && req.user.role !== 'admin') {
        throw new AuthorizationError('Not authorized to view responses for this survey');
    }

    const responses = await Response.find({ survey: survey._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('user', 'username email');

    const total = await Response.countDocuments({ survey: survey._id });

    res.json({
        status: 'success',
        data: {
            responses,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
}; 