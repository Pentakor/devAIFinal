import jwt from 'jsonwebtoken';
import User from '../storage/models/User.js';
import Survey from '../storage/models/Survey.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

export const authorizeCreator = async (req, res, next) => {
    try {
        const survey = await Survey.findById(req.params.surveyId);
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