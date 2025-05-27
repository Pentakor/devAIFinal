import { Router } from 'express';
import * as userController from '../controller/userController.js';
import {usernameSchema, voteSchema} from '../validation/zodSchemas.js';
import validate from '../validation/validateMiddleware.js';

const router = Router();

/**
 * Creates a new user.
 * 
 * @route POST /api/users
 * @returns {Promise<Object>} Created user object
 */
router.post('/', validate(usernameSchema), userController.createUser);

/**
 * Submits a vote on a poll.
 * 
 * @route POST /api/users/vote/:id
 * @returns {Promise<Object>} Updated poll after voting
 */
router.post('/vote/:id',validate(voteSchema) ,userController.voteOnPoll);

/**
 * Gets polls that a user has voted in.
 * 
 * @route GET /api/users/voted-by/:username
 * @returns {Promise<Object[]>} Array of polls
 */
router.get('/voted-by/:username', userController.userVotes);

export default router;