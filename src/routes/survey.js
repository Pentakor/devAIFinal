import express from 'express';
import { authenticate, authorizeCreator, checkSurveyExpiry } from '../middleware/auth.js';
import {
    create,
    getAll,
    getById,
    update,
    close,
    addSurveyResponse,
    search,
    updateExpiry,
    updateResponse,
    deleteSurveyResponse,
    validateResponses,
    generateSummary,
    toggleSummary,
    searchByQuery
} from '../controller/surveyController.js';
import { responseSchema } from '../validation/schemas.js';
import validate from '../validation/validateMiddleware.js';

const router = express.Router();

router.post('/', authenticate, create);
router.get('/', getAll);
router.get('/search', search);
router.get('/search/natural', authenticate, searchByQuery);
router.get('/:id', getById);
router.put('/:id', authenticate, authorizeCreator, checkSurveyExpiry, update);
router.post('/:id/close', authenticate, authorizeCreator, close);
router.post('/:id/responses', authenticate, checkSurveyExpiry, validate(responseSchema), addSurveyResponse);
router.put('/:id/responses/:responseId', authenticate, checkSurveyExpiry, validate(responseSchema), updateResponse);
router.delete('/:id/responses/:responseId', authenticate, authorizeCreator, deleteSurveyResponse);
router.put('/:id/expiry', authenticate, authorizeCreator, updateExpiry);
router.get('/:id/validate-responses', authenticate, authorizeCreator, validateResponses);
router.post('/:id/summary', authenticate, authorizeCreator, generateSummary);
router.post('/:id/toggle-summary', authenticate, authorizeCreator, toggleSummary);

export default router; 