import express from 'express';
import registerMiddleware from './middleware/registerMiddleware.js';
import registerRoutes from './routes/registerRoutes.js';

/**
 * Initializes the Express app.
 * 
 * @module app
 */
const app = express();

registerMiddleware(app);
registerRoutes(app);

export default app;
