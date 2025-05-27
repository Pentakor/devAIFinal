import userRoutes from './userRoutes.js';
import pollRoutes from './pollRoutes.js';

/**
 * Registers all route modules.
 * 
 * @param {Object} app
 */
export default function registerRoutes(app) {
  app.use('/api/users', userRoutes);
  app.use('/api/polls', pollRoutes);
}
