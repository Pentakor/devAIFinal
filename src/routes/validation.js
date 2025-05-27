import express from 'express';
import { validateSurveyResponses } from '../controller/validationController.js';

const router = express.Router();

// Validate survey responses
router.post('/validate', validateSurveyResponses);

export default router; 