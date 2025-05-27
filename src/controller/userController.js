import * as userService from '../service/userService.js';

/**
 * Creates a new user.
 * @route POST /api/users
 * @param {Object} req - Express request object containing `username` in body
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const createUser = async (req, res) => {
  const { username } = req.body;

  try {
    const existingUser = await userService.getUser(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const newUser = await userService.createUser(username);
    return res.status(201).json({ message: 'User created', user: newUser });
  } catch (err) {
    console.error('Error in createUser controller:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles a user's vote on a poll.
 * @route POST /api/users/vote/:id
 * @param {Object} req - Express request object with `username`, `optionId` in body and `id` in params
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const voteOnPoll = async (req, res) => {
  try {
    const pollId = req.params.id;
    const { username, optionId } = req.body;

    const updatedPoll = await userService.voteOnPoll(pollId, username, optionId);
    res.status(200).json(updatedPoll);
  } catch (err) {
    if (err.message === "Poll not found") {
      res.status(404).json({ error: err.message });
    } else if (
      err.message === "Invalid option index" ||
      err.message === "User has already voted" || // Handles duplicate votes
      err.message === "Poll ID is required and must be a string" ||
      err.message === "Username is required and must be a string" ||
      err.message === "Option index is required and must be a non-negative number"
    ) {
      res.status(400).json({ error: err.message, statusCode: 400 }); // Include statusCode in the response
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

/**
 * Gets all polls that a specific user has voted in.
 * @route GET /api/users/voted-by/:username
 * @param {Object} req - Express request object containing `username` in params
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const userVotes = async (req, res) => {
  try {
    const { username } = req.params;
    const polls = await userService.getVotedPollsByUser(username);
    res.status(200).json(polls);
  } catch (err) {
    if (err.message === "Username is required and must be a string") {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

