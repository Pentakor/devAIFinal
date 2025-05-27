import app from './app.js'; // Ensure app.js defines routes for /users, /polls, etc.

let server;

/**
 * Starts the Express server.
 * @returns {Promise<{ baseURL: string }>} The base URL of the running server.
 */
export const start = async () => {
  const PORT = 3000;
  return new Promise((resolve, reject) => {
    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      resolve({ baseURL: `http://localhost:${PORT}/api` });
    }).on('error', (error) => {
      console.error('Error starting the server:', error);
      reject(error);
    });
  });
};

/**
 * Stops the Express server.
 * @returns {Promise<void>}
 */
export const stop = async () => {
  if (!server) {
    console.warn('Server is not running.');
    return;
  }
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        console.error('Error stopping the server:', error);
        reject(error);
      } else {
        console.log('Server stopped successfully');
        resolve();
      }
    });
  });
};
