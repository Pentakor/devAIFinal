import express from 'express';
import { 
    createSurvey,
    getSurvey,
    updateSurvey,
    deleteSurvey,
    listSurveys,
    searchSurveys,
    submitResponse,
    listResponses
} from '../controllers/surveyController.js';
import { validateRequest, validateParams, validateQuery } from '../middleware/validateRequest.js';
import { 
    surveySchema, 
    responseSchema, 
    searchSchema,
    idParamSchema,
    responseIdParamSchema,
    paginationSchema
} from '../validation/schemas.js';
import { asyncHandler } from '../utils/errors.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Survey CRUD operations
router.post('/',
    authorize(['admin', 'creator']),
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

router.get('/:id',
    validateParams(idParamSchema),
    asyncHandler(getSurvey)
);

router.put('/:id',
    authorize(['admin', 'creator']),
    validateParams(idParamSchema),
    validateRequest(surveySchema),
    asyncHandler(updateSurvey)
);

router.delete('/:id',
    authorize(['admin', 'creator']),
    validateParams(idParamSchema),
    asyncHandler(deleteSurvey)
);

// Response operations
router.post('/:id/responses',
    validateParams(idParamSchema),
    validateRequest(responseSchema),
    asyncHandler(submitResponse)
);

router.get('/:id/responses',
    authorize(['admin', 'creator']),
    validateParams(idParamSchema),
    validateQuery(paginationSchema),
    asyncHandler(listResponses)
);

export default router; 