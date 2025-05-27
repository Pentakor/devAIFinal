import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { 
    ValidationError, 
    AuthenticationError, 
    ConflictError 
} from '../utils/errors.js';

export const register = async (req, res) => {
    const { username, email, password, registrationCode } = req.body;

    // Check if registration code is valid
    if (registrationCode !== process.env.REGISTRATION_SECRET) {
        throw new ValidationError('Invalid registration code');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
        throw new ConflictError('User with this email or username already exists');
    }

    // Create new user
    const user = new User({
        username,
        email,
        passwordHash: await User.hashPassword(password)
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.status(201).json({
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
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        throw new AuthenticationError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
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
}; 