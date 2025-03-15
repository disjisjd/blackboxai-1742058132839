const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nama barang is required'],
        trim: true
    },
    size: {
        type: String,
        required: [true, 'Size/Type is required'],
        trim: true
    },
    stock: {
        type: Number,
        required: [true, 'Stock is required'],
        min: [0, 'Stock cannot be negative']
    },
    rackId: {
        type: String,
        required: [true, 'Rack ID is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['available', 'out-of-stock', 'lost'],
        default: 'available'
    },
    borrowCount: {
        type: Number,
        default: 0
    },
    lastRestockDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update status based on stock
itemSchema.pre('save', function(next) {
    if (this.stock === 0) {
        this.status = 'out-of-stock';
    } else if (this.status === 'out-of-stock' && this.stock > 0) {
        this.status = 'available';
    }
    next();
});

// Static method to get items by rack
itemSchema.statics.getItemsByRack = async function(rackId) {
    return await this.find({ rackId });
};

// Static method to get out of stock items
itemSchema.statics.getOutOfStockItems = async function() {
    return await this.find({ status: 'out-of-stock' });
};

// Static method to get lost items
itemSchema.statics.getLostItems = async function() {
    return await this.find({ status: 'lost' });
};

// Method to update stock
itemSchema.methods.updateStock = async function(quantity) {
    this.stock += quantity;
    if (this.stock < 0) this.stock = 0;
    
    if (quantity > 0) {
        this.lastRestockDate = new Date();
    }
    
    await this.save();
};

// Method to mark item as lost
itemSchema.methods.markAsLost = async function() {
    this.status = 'lost';
    this.stock = 0;
    await this.save();
};

// Method to check if item can be borrowed
itemSchema.methods.canBeBorrowed = function() {
    return this.status === 'available' && this.stock > 0;
};

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
