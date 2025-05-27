import * as storage from '../Storage/user.js';
import * as pollStorage from '../Storage/poll.js';
import { getPoll, savePoll } from '../Storage/poll.js';

/**
 * Retrieves a user by username.
 * 
 * @param {string} username - The username to look up
 * @returns {Promise<string | undefined>} The user if found, otherwise undefined
 */
export const getUser = async (username) => {
  return storage.getUser(username);
};

/**
 * Creates a new user.
 * 
 * @param {string} username - The username for the new user
 * @returns {Promise<{ username: string }>} The created user object
 * @throws {Error} If the user already exists
 */
export const createUser = async (username) => {
  const existingUser = await storage.getUser(username);
  if (existingUser) {
    throw new Error("User already exists");
  }

  return storage.createUser(username);
};

/**
 * 
 * @param {string} id - pool ID
 * @param {string} username - The voting user's username
 * @param {number} optionIndex - The index of the option the user is voting for
 * @return {Promise<Object>} The updated poll object
 * @throws {Error} If the poll ID is invalid, the user does not exist, the option index is invalid, or the user has already voted
 */
export const voteOnPoll = async (id, username, optionIndex) => {
  if (!id || typeof id !== 'string') {
    throw new Error("Poll ID is required and must be a string");
  }

  if (!username || typeof username !== 'string') {
    throw new Error("Username is required and must be a string");
  }

  if (typeof optionIndex !== 'number' || optionIndex < 0) {
    throw new Error("Option index is required and must be a non-negative number");
  }

  const user = await storage.getUser(username);
  if (!user) {
    throw new Error("User does not exist");
  }

  const poll = await getPoll(id);

  if (!poll) {
    throw new Error("Poll not found");
  }

  if (optionIndex >= poll.options.length) {
    throw new Error("Invalid option index");
  }

  if (poll.votes[username] !== undefined) {
    throw new Error("User has already voted");
  }

  // Update the votes
  poll.votes[username] = optionIndex;

  // Save the updated poll
  await savePoll(poll);
  return poll;
};

/**
 * Gets all polls that the given user has voted on.
 * 
 * @param {string} username - Username to query
 * @returns {Promise<Object[]>} An array of polls the user has voted in
 * @throws {Error} If username is invalid
 */
export const getVotedPollsByUser = async (username) => {
  // Validate input
  if (!username || typeof username !== 'string') {
    throw new Error("Username is required and must be a string");
  }

  const allPolls = await pollStorage.getAllPolls();

  // Filter polls where the user has voted
  return allPolls.filter(poll => poll.votes[username] !== undefined);
};