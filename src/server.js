import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { loadPrompts } from './utils/promptLoader.js';
import surveyRoutes from './routes/surveys.js';
import authRoutes from './routes/auth.js';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Configure Winston logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load prompts
let prompts;
try {
    const promptsDir = path.join(__dirname, 'prompts');
    prompts = await loadPrompts(promptsDir);
    app.locals.prompts = prompts;
    logger.info('Prompts loaded successfully');
} catch (error) {
    logger.error('Failed to load prompts:', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
}

// Routes
app.use('/api/surveys', surveyRoutes);
app.use('/api/auth', authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    logger.info('Connected to MongoDB');
})
.catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed');
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
    process.exit(1);
});
