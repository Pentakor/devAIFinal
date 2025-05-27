import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AuthenticationError } from '../utils/errors.js';
import Survey from '../models/Survey.js';

export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('No token provided');
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new AuthenticationError('User not found');
        }

        if (!user.isActive) {
            throw new AuthenticationError('Account is deactivated');
        }

        // Add user to request
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
            return res.status(404).json({ message: 'Survey not found' });
        }

        if (survey.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to perform this action' });
        }

        req.survey = survey;
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};

export const checkSurveyExpiry = async (req, res, next) => {
    try {
        const survey = await Survey.findById(req.params.id);
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        if (new Date() > survey.expiryDate) {
            return res.status(400).json({ message: 'Survey has expired' });
        }

        req.survey = survey;
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
}; 