import { Router } from 'express';
import * as pollController from '../controller/pollController.js';
import {usernameSchema, pollSchema} from '../validation/zodSchemas.js';
import validate from '../validation/validateMiddleware.js';

const router = Router();

/**
 * Creates a new poll.
 * 
 * @route POST /api/polls
 * @returns {Promise<Object>} Created poll object
 */
router.post('/', validate(pollSchema), pollController.createPoll);

/**
 * @route GET /api/polls
 * @returns {Promise<Object[]>} Array of all polls
 */
router.get('/', pollController.getPolls);

/**
 * Deletes a poll (only allowed by creator).
 * 
 * @route DELETE /api/polls/:id
 * @returns {Promise<void>} No content
 */
router.delete('/:id', validate(usernameSchema), pollController.deletePoll);

/**
 * Gets polls created by a specific user.
 * 
 * @route GET /api/polls/created-by/:username
 * @returns {Promise<Object[]>} Array of polls created by the user
 */
router.get('/created-by/:username', pollController.getPollsByUser);

export default router;