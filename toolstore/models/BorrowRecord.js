const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: [true, 'Item reference is required']
    },
    borrowDate: {
        type: Date,
        default: Date.now
    },
    returnDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Dipinjam', 'Dikembalikan'],
        default: 'Dipinjam'
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
borrowRecordSchema.index({ user: 1, status: 1 });
borrowRecordSchema.index({ item: 1, status: 1 });

// Static method to get active borrows for a user
borrowRecordSchema.statics.getActiveBorrows = async function(userId) {
    return await this.find({
        user: userId,
        status: 'Dipinjam'
    }).populate('item');
};

// Static method to get all active borrows
borrowRecordSchema.statics.getAllActiveBorrows = async function() {
    return await this.find({
        status: 'Dipinjam'
    }).populate('user item');
};

// Method to mark as returned
borrowRecordSchema.methods.markAsReturned = async function() {
    this.status = 'Dikembalikan';
    this.returnDate = new Date();
    
    // Update item stock
    const item = await mongoose.model('Item').findById(this.item);
    if (item) {
        await item.updateStock(1); // Increment stock by 1
    }
    
    await this.save();
};

// Pre-save hook to update item stock when borrowing
borrowRecordSchema.pre('save', async function(next) {
    if (this.isNew) {
        const item = await mongoose.model('Item').findById(this.item);
        if (item) {
            if (!item.canBeBorrowed()) {
                next(new Error('Item cannot be borrowed at this time'));
                return;
            }
            await item.updateStock(-1); // Decrement stock by 1
        }
    }
    next();
});

// Virtual for borrow duration
borrowRecordSchema.virtual('borrowDuration').get(function() {
    if (!this.returnDate) {
        return Math.floor((new Date() - this.borrowDate) / (1000 * 60 * 60 * 24)); // Days
    }
    return Math.floor((this.returnDate - this.borrowDate) / (1000 * 60 * 60 * 24)); // Days
});

// Ensure virtuals are included in JSON output
borrowRecordSchema.set('toJSON', { virtuals: true });
borrowRecordSchema.set('toObject', { virtuals: true });

const BorrowRecord = mongoose.model('BorrowRecord', borrowRecordSchema);

module.exports = BorrowRecord;
