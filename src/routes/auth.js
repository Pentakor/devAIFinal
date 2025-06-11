    import express from 'express';
    import { register, login } from '../controllers/authController.js';
    import { validateRequest } from '../middleware/validateRequest.js';
    import { registerSchema, loginSchema } from '../validation/schemas.js';
    import { asyncHandler } from '../utils/errors.js';

    const router = express.Router();

    // Register new user
    router.post('/register', 
        validateRequest(registerSchema),
        asyncHandler(register)
    );

    // Login user
    router.post('/login',
        validateRequest(loginSchema),
        asyncHandler(login)
    );

    export default router; 