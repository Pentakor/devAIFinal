// storage/poll.js

const polls = new Map(); // key: poll.id, value: poll object

/**
 * Clears all stored polls (used for testing).
 */
export const __resetStorage = () => {
  polls.clear();
};

/**
 * Saves a poll object to memory.
 * 
 * @param {Object} poll - The poll object to store
 * @param {string} poll.id - Unique ID of the poll
 * @param {string} poll.creator - Username of the poll creator
 * @param {string} poll.question - Poll question
 * @param {string[]} poll.options - Array of option strings
 * @param {Object.<string, number>} poll.votes - Map of username → option index
 * @returns {Promise<void>}
 */
export const savePoll = async (poll) => {
  polls.set(poll.id, poll);
};

/**
 * Retrieves a poll by its ID.
 * 
 * @param {string} id - The ID of the poll
 * @returns {Promise<Object|null>} The poll object if found, or null if not
 */
export const getPoll = async (id) => {
  return polls.get(id) || null;
};

/**
 * Deletes a poll by its ID.
 * 
 * @param {string} id - The ID of the poll to delete
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deletePoll = async (id) => {
  return polls.delete(id);
};

/**
 * Gets all polls currently in storage.
 * 
 * @returns {Promise<Object[]>} An array of all poll objects
 */
export const getAllPolls = async () => {
  return Array.from(polls.values());
};

/**
 * Gets all polls created by a specific user.
 * 
 * @param {string} username - The creator's username
 * @returns {Promise<Object[]>} An array of polls created by the user
 */
export const getPollsByCreator = async (username) => {
  return Array.from(polls.values()).filter(poll => poll.creator === username);
};
