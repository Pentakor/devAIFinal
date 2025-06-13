import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Survey from '../models/Survey.js';
import {
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ValidationError
} from '../utils/errors.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('No token provided');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            throw new AuthenticationError('User not found');
        }

        if (!user.isActive) {
            throw new AuthenticationError('Account is deactivated');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new AuthenticationError('Invalid token'));
        } else if (error.name === 'TokenExpiredError') {
            next(new AuthenticationError('Token expired'));
        } else {
            next(error);
        }
    }
};

export const authorizeCreator = async (req, res, next) => {
    try {
        const survey = await Survey.findById(req.params.id);
        if (!survey) {
            throw new NotFoundError('Survey not found');
        }

        if (!survey.creator.equals(req.user._id)) {
            throw new AuthorizationError('Not authorized to perform this action');
        }

        req.survey = survey;
        next();
    } catch (error) {
        next(error);
    }
};

export const checkSurveyExpiry = async (req, res, next) => {
    try {
        const survey = await Survey.findById(req.params.id);
        if (!survey) {
            throw new NotFoundError('Survey not found');
        }

        if (new Date() > survey.expiryDate) {
            throw new ValidationError('Survey has expired');
        }

        req.survey = survey;
        next();
    } catch (error) {
        next(error);
    }
};
