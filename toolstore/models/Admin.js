const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return v === 'TSABPNJ';
            },
            message: 'Username must be TSABPNJ'
        }
    },
    password: {
        type: String,
        required: true
    },
    nim: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return v === '20001';
            },
            message: 'NIM must be 20001'
        }
    },
    yearOfEnrollment: {
        type: Number,
        required: true,
        validate: {
            validator: function(v) {
                return v === 2001;
            },
            message: 'Year of enrollment must be 2001'
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
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
adminSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Ensure only one admin can exist
adminSchema.statics.adminExists = async function() {
    const count = await this.countDocuments();
    return count > 0;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
