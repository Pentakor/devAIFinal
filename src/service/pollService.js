import { v4 as uuidv4 } from 'uuid';
import {
  savePoll,
  getAllPolls,
  getPollsByCreator,
  getPoll, 
  deletePoll as deletePollFromStorage
} from '../Storage/poll.js';
import { getUser } from '../service/userService.js';

/**
 * Creates a new poll and saves it to storage.
 * 
 * @param {Object} pollData - Data for the poll
 * @param {string} pollData.creator - Username of the poll creator
 * @param {string} pollData.question - The poll question text
 * @param {string[]} pollData.options - List of answer options
 * @returns {Promise<Object>} The created poll object
 * @throws {Error} If validation fails or user does not exist
 */
export const createPoll = async ({ creator, question, options }) => {
  if (!creator || typeof creator !== 'string') {
    throw new Error("Creator is required and must be a string");
  }

  const existingUser = await getUser(creator);
  if (!existingUser) {
    throw new Error("Creator does not exist");
  }

  if (!question || typeof question !== 'string') {
    throw new Error("Question is required and must be a string");
  }

  if (!Array.isArray(options) || options.length < 2) {
    throw new Error("At least two options are required");
  }

  if (new Set(options).size !== options.length) {
    throw new Error("Duplicate options are not allowed");
  }

/**
 * @typedef {Object.<string, number>} Votes
 * A map of usernames to the index of the option they selected.
 */
  const newPoll = {
    id: uuidv4(),
    creator,
    question,
    options,
    /** @type {Votes} */
    votes: {}
  };

  await savePoll(newPoll);
  return newPoll;
};

/**
 * Retrieves all polls from storage.
 * 
 * @returns {Promise<Object[]>} Array of poll objects
 */
export const getPolls = async () => {
  return await getAllPolls();
};

/**
 * Gets polls created by a specific user.
 * 
 * @param {string} username - Username of the creator
 * @returns {Promise<Object[]>} Array of poll objects created by the user
 * @throws {Error} If username is invalid
 */
export const getPollsByUser = async (username) => {
  if (!username || typeof username !== 'string') {
    throw new Error("Username is required and must be a string");
  }

  return await getPollsByCreator(username);
};

/**
 * Deletes a poll by its ID, if the user is the creator.
 * 
 * @param {string} id - ID of the poll to delete
 * @param {string} username - Username of the person requesting the deletion
 * @returns {Promise<void>}
 * @throws {Error} If the poll is not found or user is unauthorized
 */
export const deletePoll = async (id, username) => {
  if (!id || typeof id !== 'string') {
    throw new Error("Poll ID is required and must be a string");
  }

  if (!username || typeof username !== 'string') {
    throw new Error("Username is required and must be a string");
  }

  const poll = await getPoll(id);

  if (!poll) {
    throw new Error("Poll not found");
  }

  if (poll.creator !== username) {
    throw new Error("You are not authorized to delete this poll");
  }

  await deletePollFromStorage(id);
};

