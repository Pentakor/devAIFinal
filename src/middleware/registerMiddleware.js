import express from 'express';

/**
 * Registers global middleware on the app.
 * 
 * @param {Object} app
 */
export default function registerMiddleware(app) {
  app.use(express.json());

  // CORS setup
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  });
}
