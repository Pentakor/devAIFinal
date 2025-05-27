import express from 'express';
import { 
    createSurvey,
    getSurvey,
    updateSurvey,
    deleteSurvey,
    listSurveys,
    searchSurveys,
    submitResponse,
    listResponses,
    closeSurvey,
    getSurveyExpiry,
    updateSurveyExpiry
} from '../controllers/surveyController.js';
import { validateRequest, validateParams, validateQuery } from '../middleware/validateRequest.js';
import { 
    surveySchema, 
    responseSchema, 
    searchSchema,
    idParamSchema,
    responseIdParamSchema,
    paginationSchema,
    updateExpirySchema
} from '../validation/schemas.js';
import { asyncHandler } from '../utils/errors.js';
import { authenticate, authorizeCreator } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Survey CRUD operations
router.post('/',
    validateRequest(surveySchema),
    asyncHandler(createSurvey)
);

router.post('/:id/close',
    validateParams(idParamSchema),
    authorizeCreator,
    asyncHandler(closeSurvey)
);

router.get('/',
    validateQuery(paginationSchema),
    asyncHandler(listSurveys)
);

router.get('/search',
    validateQuery(searchSchema),
    asyncHandler(searchSurveys)
);

router.get('/:id',
    validateParams(idParamSchema),
    asyncHandler(getSurvey)
);

router.put('/:id',
    validateParams(idParamSchema),
    validateRequest(surveySchema),
    authorizeCreator,
    asyncHandler(updateSurvey)
);

router.delete('/:id',
    validateParams(idParamSchema),
    authorizeCreator,
    asyncHandler(deleteSurvey)
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

// Response operations
router.post('/:id/responses',
    validateParams(idParamSchema),
    validateRequest(responseSchema),
    asyncHandler(submitResponse)
);

router.get('/:id/responses',
    validateParams(idParamSchema),
    validateQuery(paginationSchema),
    authorizeCreator,
    asyncHandler(listResponses)
);

export default router; 