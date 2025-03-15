const Item = require('../models/Item');
const User = require('../models/User');
const BorrowRecord = require('../models/BorrowRecord');
const fs = require('fs').promises;
const path = require('path');

const adminController = {
    // Dashboard
    getDashboard: async (req, res) => {
        try {
            const totalItems = await Item.countDocuments();
            const outOfStockItems = await Item.countDocuments({ status: 'out-of-stock' });
            const lostItems = await Item.countDocuments({ status: 'lost' });
            const activeBorrows = await BorrowRecord.countDocuments({ status: 'Dipinjam' });
            
            res.render('dashboard/admin', {
                title: 'Admin Dashboard',
                stats: {
                    totalItems,
                    outOfStockItems,
                    lostItems,
                    activeBorrows
                }
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading dashboard');
            res.redirect('/');
        }
    },

    // Item Management
    getItems: async (req, res) => {
        try {
            const items = await Item.find().sort('name');
            res.render('admin/items', {
                title: 'Manage Items',
                items
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading items');
            res.redirect('/admin/dashboard');
        }
    },

    addItem: async (req, res) => {
        try {
            const { name, size, stock, rackId } = req.body;
            
            const newItem = new Item({
                name,
                size,
                stock: parseInt(stock),
                rackId
            });

            await newItem.save();
            req.flash('success_msg', 'Item added successfully');
            res.redirect('/admin/items');
        } catch (error) {
            req.flash('error_msg', error.message);
            res.redirect('/admin/items');
        }
    },

    editItem: async (req, res) => {
        try {
            const { id, name, size, stock } = req.body;
            
            const item = await Item.findById(id);
            if (!item) {
                req.flash('error_msg', 'Item not found');
                return res.redirect('/admin/items');
            }

            item.name = name;
            item.size = size;
            item.stock = parseInt(stock);
            await item.save();

            req.flash('success_msg', 'Item updated successfully');
            res.redirect('/admin/items');
        } catch (error) {
            req.flash('error_msg', error.message);
            res.redirect('/admin/items');
        }
    },

    deleteItem: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Check if item has active borrows
            const activeBorrows = await BorrowRecord.exists({
                item: id,
                status: 'Dipinjam'
            });

            if (activeBorrows) {
                req.flash('error_msg', 'Cannot delete item with active borrows');
                return res.redirect('/admin/items');
            }

            await Item.findByIdAndDelete(id);
            req.flash('success_msg', 'Item deleted successfully');
            res.redirect('/admin/items');
        } catch (error) {
            req.flash('error_msg', error.message);
            res.redirect('/admin/items');
        }
    },

    // Borrow Management
    getBorrows: async (req, res) => {
        try {
            const borrows = await BorrowRecord.find()
                .populate('user', 'username nama')
                .populate('item', 'name size')
                .sort('-borrowDate');

            res.render('admin/borrows', {
                title: 'Manage Borrows',
                borrows
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading borrows');
            res.redirect('/admin/dashboard');
        }
    },

    markAsReturned: async (req, res) => {
        try {
            const { id } = req.params;
            const borrow = await BorrowRecord.findById(id);
            
            if (!borrow) {
                req.flash('error_msg', 'Borrow record not found');
                return res.redirect('/admin/borrows');
            }

            await borrow.markAsReturned();
            req.flash('success_msg', 'Item marked as returned');
            res.redirect('/admin/borrows');
        } catch (error) {
            req.flash('error_msg', error.message);
            res.redirect('/admin/borrows');
        }
    },

    // Store Map Management
    getMap: async (req, res) => {
        try {
            const mapPath = path.join(__dirname, '../public/uploads/maps/store-map.jpg');
            const mapExists = await fs.access(mapPath).then(() => true).catch(() => false);
            
            res.render('admin/map', {
                title: 'Store Map',
                mapExists
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading map page');
            res.redirect('/admin/dashboard');
        }
    },

    uploadMap: async (req, res) => {
        try {
            if (!req.file) {
                throw new Error('No file uploaded');
            }

            req.flash('success_msg', 'Map uploaded successfully');
            res.redirect('/admin/map');
        } catch (error) {
            req.flash('error_msg', error.message);
            res.redirect('/admin/map');
        }
    },

    // User Management
    getUsers: async (req, res) => {
        try {
            const users = await User.find().select('-password').sort('username');
            res.render('admin/users', {
                title: 'Manage Users',
                users
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading users');
            res.redirect('/admin/dashboard');
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Check for active borrows
            const activeBorrows = await BorrowRecord.exists({
                user: id,
                status: 'Dipinjam'
            });

            if (activeBorrows) {
                req.flash('error_msg', 'Cannot delete user with active borrows');
                return res.redirect('/admin/users');
            }

            await User.findByIdAndUpdate(id, { isActive: false });
            req.flash('success_msg', 'User deleted successfully');
            res.redirect('/admin/users');
        } catch (error) {
            req.flash('error_msg', error.message);
            res.redirect('/admin/users');
        }
    },

    // Lost Items Management
    getLostItems: async (req, res) => {
        try {
            const lostItems = await Item.find({ status: 'lost' }).sort('name');
            const outOfStockItems = await Item.find({ status: 'out-of-stock' }).sort('name');
            
            res.render('admin/lost-items', {
                title: 'Lost & Out of Stock Items',
                lostItems,
                outOfStockItems
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading items');
            res.redirect('/admin/dashboard');
        }
    },

    markAsLost: async (req, res) => {
        try {
            const { id } = req.params;
            const item = await Item.findById(id);
            
            if (!item) {
                req.flash('error_msg', 'Item not found');
                return res.redirect('/admin/lost-items');
            }

            await item.markAsLost();
            req.flash('success_msg', 'Item marked as lost');
            res.redirect('/admin/lost-items');
        } catch (error) {
            req.flash('error_msg', error.message);
            res.redirect('/admin/lost-items');
        }
    },

    addStock: async (req, res) => {
        try {
            const { id, quantity } = req.body;
            const item = await Item.findById(id);
            
            if (!item) {
                req.flash('error_msg', 'Item not found');
                return res.redirect('/admin/lost-items');
            }

            await item.updateStock(parseInt(quantity));
            req.flash('success_msg', 'Stock updated successfully');
            res.redirect('/admin/lost-items');
        } catch (error) {
            req.flash('error_msg', error.message);
            res.redirect('/admin/lost-items');
        }
    }
};

module.exports = adminController;
