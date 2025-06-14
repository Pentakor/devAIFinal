import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'],
        validate: {
            validator: function(v) {
                return !/\s/.test(v); // No whitespace allowed
            },
            message: 'Username cannot contain whitespace'
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        validate: {
            validator: function(v) {
                // Check for common disposable email domains
                const disposableDomains = ['tempmail.com', 'throwaway.com'];
                const domain = v.split('@')[1];
                return !disposableDomains.includes(domain);
            },
            message: 'Disposable email addresses are not allowed'
        }
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        validate: {
            validator: function(v) {
                return v.length >= 60; // bcrypt hashes are always 60 characters
            },
            message: 'Invalid password hash'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        validate: {
            validator: function(v) {
                return !v || v <= new Date();
            },
            message: 'Last login date cannot be in the future'
        }
    },
    passwordResetToken: {
        type: String,
        select: false // Don't include in queries by default
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
userSchema.index({ isActive: 1 });

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!candidatePassword) {
        return false; // Or throw an error if preferred
    }
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    return this.save();
};

// Method to deactivate account
userSchema.methods.deactivate = async function() {
    this.isActive = false;
    return this.save();
};

// Method to reactivate account
userSchema.methods.reactivate = async function() {
    this.isActive = true;
    return this.save();
};

// Static method to hash password
userSchema.statics.hashPassword = async function(password) {
    if (!password) {
        throw new Error('Password is required');
    }
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
    if (!email) {
        throw new Error('Email is required');
    }
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by username
userSchema.statics.findByUsername = function(username) {
    if (!username) {
        throw new Error('Username is required');
    }
    return this.findOne({ username: username.toLowerCase() });
};

// Static method to get active users
userSchema.statics.getActive = function() {
    return this.find({ isActive: true });
};

// Pre-save middleware to ensure email is lowercase
userSchema.pre('save', function(next) {
    if (this.isModified('email')) {
        this.email = this.email.toLowerCase();
    }
    next();
});

// Pre-save middleware to validate password hash
userSchema.pre('save', function(next) {
    if (this.isModified('passwordHash') && this.passwordHash.length < 60) {
        next(new Error('Invalid password hash'));
    }
    next();
});

const User = mongoose.model('User', userSchema);

export default User; 