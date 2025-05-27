// storage/poll.js

/**
 * In-memory user storage using a Map.
 * Key: username, Value: username (acts as a set)
 */
const users = new Map();

/**
 * Clears all users from storage (used for testing).
 */
export const __resetStorage = () => {
  users.clear();
};

/**
 * Retrieves a user by username.
 * 
 * @param {string} username - The username to search for
 * @returns {Promise<string | undefined>} The username if found, or undefined if not
 */
export const getUser = async (username) => {
  return users.get(username);
};

/**
 * Creates a new user.
 * 
 * @param {string} username - The username to create
 * @returns {Promise<{ username: string }>} An object containing the created username
 */
export const createUser = async (username) => {
  users.set(username, username);
  return { username };
};
