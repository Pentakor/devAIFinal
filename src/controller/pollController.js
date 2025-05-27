import * as pollService from '../service/pollService.js';
import { getUser } from '../service/userService.js';

/**
 * Creates a new poll.
 * 
 * @route POST /api/polls
 * @param {Object} req - Express request object with body containing `creator`, `question`, and `options`
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} If creator doesn't exist or validation fails
 */
export const createPoll = async (req, res) => {
  try {
    const { creator, question, options } = req.body;

    const poll = await pollService.createPoll({ creator, question, options });
    res.status(201).json(poll);
  } catch (err) {
    if (err.message === "Creator does not exist") {
      res.status(404).json({ error: err.message });
    } else if (err.message.includes("required")) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

/**
 * Gets all polls in the system.
 *
 * @route GET /api/polls
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getPolls = async (req, res) => {
  try {
    const polls = await pollService.getPolls();
    res.status(200).json(polls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
};

/**
 * Gets polls created by a specific user.
 * 
 * @route GET /api/polls/created-by/:username
 * @param {Object} req - Express request with `username` in params
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} If user doesn't exist
 */
export const getPollsByUser = async (req, res) => {
  try {
    const { username } = req.params;

    const existingUser = await getUser(username);
    if (!existingUser) {
      return res.status(404).json({ error: "User does not exist" });
    }

    const polls = await pollService.getPollsByUser(username);
    res.status(200).json(polls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user polls' });
  }
};

/**
 * Deletes a poll by ID, if the requesting user is the creator.
 * 
 * @route DELETE /api/polls/:id
 * @param {Object} req - Express request with `id` in params and `username` in body
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} If poll is not found or user is not authorized
 */
export const deletePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    await pollService.deletePoll(id, username);
    res.status(204).json({ message: 'Poll deleted successfully' });
  } catch (err) {
    res.status(403).json({ error: err.message }); // מחזיר 403 אם המשתמש לא מורשה
  }
};