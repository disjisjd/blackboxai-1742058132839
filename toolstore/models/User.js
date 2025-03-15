const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true
    },
    nama: {
        type: String,
        required: [true, 'Nama is required'],
        trim: true
    },
    nim: {
        type: String,
        required: [true, 'NIM is required'],
        trim: true
    },
    angkatan: {
        type: Number,
        required: [true, 'Angkatan is required'],
        min: [1900, 'Invalid year'],
        max: [new Date().getFullYear(), 'Year cannot be in the future']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    borrowedItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BorrowRecord'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Method to check if email exists
userSchema.statics.emailExists = async function(email) {
    const user = await this.findOne({ email: email.toLowerCase() });
    return !!user;
};

// Method to check if username exists
userSchema.statics.usernameExists = async function(username) {
    const user = await this.findOne({ username });
    return !!user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
