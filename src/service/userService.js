import jwt from 'jsonwebtoken';
import User from '../storage/models/User.js';
import { registerSchema, loginSchema } from '../validation/schemas.js';

export const registerUser = async (userData) => {
    const { error } = registerSchema.validate(userData);
    if (error) {
        throw new Error(error.details[0].message);
    }

    const { username, email, password, registrationCode } = userData;

    if (registrationCode !== process.env.REGISTRATION_SECRET) {
        throw new Error('Invalid registration code');
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw new Error('User already exists');
    }

    const passwordHash = await User.hashPassword(password);
    const user = new User({
        username,
        email,
        passwordHash
    });

    await user.save();
    return { message: 'Registration successful' };
};

export const loginUser = async (credentials) => {
    const { error } = loginSchema.validate(credentials);
    if (error) {
        throw new Error(error.details[0].message);
    }

    const { email, password } = credentials;
    const user = await User.findOne({ email });
    
    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
        { userId: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return { token };
}; 