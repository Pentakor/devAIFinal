import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { 
    ValidationError, 
    AuthenticationError, 
    ConflictError 
} from '../utils/errors.js';

export const register = async (req, res, next) => {
    try {
        const { username, email, password, registrationCode } = req.body;

        // Check if registration code is valid
        if (registrationCode !== process.env.REGISTRATION_SECRET) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid registration code', // Matches test expectation
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }] // Ensure email is lowercased for lookup
        });

        if (existingUser) {
            // Directly return 409 for conflict, as per test expectation
            return res.status(409).json({
                status: 'fail',
                message: 'User with this email or username already exists',
                errorCode: 'CONFLICT_ERROR'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            passwordHash: await User.hashPassword(password) // Ensure this correctly hashes
        });

        await user.save(); // Mongoose pre-save hooks will handle email lowercasing

        res.status(201).json({
            status: 'success',
            message: 'Registration successful'
        });
    } catch (error) {
        // Log the error for debugging
        console.error('Registration error:', error);
        // Pass any unexpected errors to the next error handling middleware
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;

        // Basic validation for required fields
        if ((!email && !username) || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Email/username and password are required',
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Find user by email or username (ADDED USERNAME SUPPORT)
        let user;
        if (email) {
            user = await User.findOne({ email: email.toLowerCase() }); // Ensure email is lowercased for lookup
        } else if (username) {
            user = await User.findOne({ username });
        }

        if (!user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid email or password',
                errorCode: 'AUTHENTICATION_ERROR'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                status: 'fail',
                message: 'Account is deactivated',
                errorCode: 'AUTHENTICATION_ERROR'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password); // Crucial check
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid email or password',
                errorCode: 'AUTHENTICATION_ERROR'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role }, // Include role in token if needed elsewhere
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        // Log the error for debugging
        console.error('Login error:', error);
        // Pass any unexpected errors to the next error handling middleware
        next(error);
    }
}; 