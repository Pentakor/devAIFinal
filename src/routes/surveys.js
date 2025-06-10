import express from 'express';
import { 
    createSurvey,
    getSurvey,
    deleteSurvey,
    listSurveys,
    searchSurveys,
    submitResponse,
    listResponses,
    closeSurvey,
    getSurveyExpiry,
    updateSurveyExpiry,
    updateResponse,
    deleteSurveyResponse,
    validateResponses,
    generateSummary,
    toggleSummary,
    searchByQuery,
    deleteBadResponses
} from '../controllers/surveyController.js';
import { validateRequest, validateParams, validateQuery } from '../middleware/validateRequest.js';
import { 
    surveySchema, 
    responseSchema, 
    searchSchema,
    idParamSchema,
    responseIdParamSchema,
    paginationSchema,
    updateExpirySchema,
    naturalSearchSchema
} from '../validation/schemas.js';
import { asyncHandler } from '../utils/errors.js';
import { authenticate, authorizeCreator, checkSurveyExpiry } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Survey CRUD operations
router.post('/',
    validateRequest(surveySchema),
    asyncHandler(createSurvey)
);

router.get('/',
    validateQuery(paginationSchema),
    asyncHandler(listSurveys)
);

router.get('/search',
    validateQuery(searchSchema),
    asyncHandler(searchSurveys)
);

router.get('/search/natural',
    validateQuery(naturalSearchSchema),
    asyncHandler(searchByQuery)
);

router.get('/:id',
    validateParams(idParamSchema),
    asyncHandler(getSurvey)
);

router.delete('/:id',
    validateParams(idParamSchema),
    authorizeCreator,
    asyncHandler(deleteSurvey)
);

// Survey management operations
router.post('/:id/close',
    validateParams(idParamSchema),
    authorizeCreator,
    asyncHandler(closeSurvey)
);

router.get('/:id/expiry',
    validateParams(idParamSchema),
    asyncHandler(getSurveyExpiry)
);

router.put('/:id/expiry',
    validateParams(idParamSchema),
    validateRequest(updateExpirySchema),
    authorizeCreator,
    asyncHandler(updateSurveyExpiry)
);

router.get('/:id/validate-responses',
    validateParams(idParamSchema),
    authorizeCreator,
    asyncHandler(validateResponses)
);

router.post('/:id/summary',
    validateParams(idParamSchema),
    authorizeCreator,
    asyncHandler(generateSummary)
);

router.put('/:id/summary/visibility',
    validateParams(idParamSchema),
    authorizeCreator,
    asyncHandler(toggleSummary)
);

// Response operations
router.post('/:id/responses',
    validateParams(idParamSchema),
    validateRequest(responseSchema),
    checkSurveyExpiry,
    asyncHandler(submitResponse)
);

router.put('/:id/responses/:responseId',
    validateParams(responseIdParamSchema),
    validateRequest(responseSchema),
    checkSurveyExpiry,
    asyncHandler(updateResponse)
);

router.delete('/:id/responses/:responseId',
    validateParams(responseIdParamSchema),
    authorizeCreator,
    asyncHandler(deleteSurveyResponse)
);

router.get('/:id/responses',
    validateParams(idParamSchema),
    validateQuery(paginationSchema),
    authorizeCreator,
    asyncHandler(listResponses)
);

router.delete('/:id/bad-responses',
    validateParams(idParamSchema),
    authorizeCreator,
    asyncHandler(deleteBadResponses)
);

export default router; 