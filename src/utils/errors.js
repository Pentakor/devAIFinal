import winston from 'winston';

// Custom error classes
export class AppError extends Error {
    constructor(message, statusCode, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends Error {
    constructor(message = 'Validation failed', details = null) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400; // Bad Request
        this.status = 'fail';
        this.errorCode = 'VALIDATION_ERROR';
        this.details = details;
    }
}

export class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = 401; // Unauthorized
        this.status = 'fail';
        this.errorCode = 'AUTHENTICATION_ERROR';
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'Not authorized') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND_ERROR');
    }
}

export class ConflictError extends Error {
    constructor(message = 'Conflict occurred') {
        super(message);
        this.name = 'ConflictError';
        this.statusCode = 409; // Conflict
        this.status = 'fail';
        this.errorCode = 'CONFLICT_ERROR';
    }
}
// Error handler middleware
export const errorHandler = (err, req, res, next) => {
    // Log the error for debugging purposes (Winston will handle this)
    if (req.app.get('env') === 'development') {
        console.error('Error in global handler:', err);
    }

    let statusCode = err.statusCode || 500;
    let status = err.status || 'error';
    let message = err.message || 'Internal Server Error';
    let errorCode = err.errorCode || 'UNKNOWN_ERROR';

    // Handle specific error types
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        statusCode = 400;
        status = 'fail';
        message = 'Invalid request format';
        errorCode = 'VALIDATION_ERROR';
    } else if (err.name === 'ValidationError') {
        statusCode = 400;
        status = 'fail';
        message = err.message || 'Validation failed';
        errorCode = 'VALIDATION_ERROR';
    } else if (err.name === 'MongoServerError' && err.code === 11000) {
        statusCode = 409;
        status = 'fail';
        message = `Duplicate field value: ${Object.keys(err.keyValue).join(', ')}`;
        errorCode = 'CONFLICT_ERROR';
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401;
        status = 'fail';
        message = 'Invalid or expired token';
        errorCode = 'AUTHENTICATION_ERROR';
    } else if (err.name === 'AuthenticationError') {
        statusCode = err.statusCode || 401;
        status = err.status || 'fail';
        message = err.message;
        errorCode = err.errorCode || 'AUTHENTICATION_ERROR';
    } else if (err.name === 'ConflictError') {
        statusCode = err.statusCode || 409;
        status = err.status || 'fail';
        message = err.message;
        errorCode = err.errorCode || 'CONFLICT_ERROR';
    } else if (err.name === 'Error' && err.message === 'Invalid password hash') {
        statusCode = 400;
        status = 'fail';
        message = 'Invalid password hash';
        errorCode = 'VALIDATION_ERROR';
    }

    const errorResponse = {
        error: {
            code: errorCode,
            message: message
        }
    };
    
    if (err.details) {
        errorResponse.error.details = err.details;
    }
    
    

    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
};


// Async handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Error logger
export const errorLogger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
}); 