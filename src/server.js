import express from 'express';
import cors from 'cors';
import { loadPrompts } from './utils/promptLoader.js';
import surveyRoutes from './routes/survey.js';
import authRoutes from './routes/auth.js';
import mongoose from 'mongoose';
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';  // Import the app configuration

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/survey-ai', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Load prompts
let prompts;
try {
    const promptsDir = path.join(__dirname, 'prompts');
    prompts = await loadPrompts(promptsDir);
    app.locals.prompts = prompts;
    console.log('Prompts loaded successfully');
} catch (error) {
    console.error('Failed to load prompts:', error);
    process.exit(1);
}

// Routes
app.use('/api/surveys', surveyRoutes);
app.use('/api/auth', authRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = 3000;
const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

// Connect to database
connectDB();

// Graceful shutdown function
const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    // Close server first to stop accepting new connections
    server.close(() => {
        logger.info('HTTP server closed');
    });

    // Close MongoDB connection
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
    } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
    }

    // Exit process
    process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});
