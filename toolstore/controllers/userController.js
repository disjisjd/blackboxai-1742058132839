const Item = require('../models/Item');
const BorrowRecord = require('../models/BorrowRecord');
const fs = require('fs').promises;
const path = require('path');

const userController = {
    // Dashboard
    getDashboard: async (req, res) => {
        try {
            // Get user's active borrows
            const activeBorrows = await BorrowRecord.find({
                user: req.session.user.id,
                status: 'Dipinjam'
            }).populate('item');

            // Get unique rack IDs
            const racks = await Item.distinct('rackId');

            res.render('dashboard/user', {
                title: 'User Dashboard',
                user: req.session.user,
                activeBorrows,
                racks
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading dashboard');
            res.redirect('/');
        }
    },

    // Rack Management
    getRacks: async (req, res) => {
        try {
            const racks = await Item.distinct('rackId');
            res.render('user/racks', {
                title: 'Daftar Rak',
                racks
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading racks');
            res.redirect('/user/dashboard');
        }
    },

    // Get Items in a Rack
    getRackItems: async (req, res) => {
        try {
            const { rackId } = req.params;
            const items = await Item.find({ rackId }).sort('name');

            // Get user's current borrows to check if they already have the item
            const userBorrows = await BorrowRecord.find({
                user: req.session.user.id,
                status: 'Dipinjam'
            }).select('item');

            const borrowedItemIds = userBorrows.map(borrow => borrow.item.toString());

            // Add borrowability status to each item
            const itemsWithStatus = items.map(item => ({
                ...item.toObject(),
                canBorrow: item.canBeBorrowed() && !borrowedItemIds.includes(item._id.toString())
            }));

            res.render('user/rack-items', {
                title: `Items in Rack ${rackId}`,
                items: itemsWithStatus,
                rackId
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading rack items');
            res.redirect('/user/racks');
        }
    },

    // Borrow an Item
    borrowItem: async (req, res) => {
        try {
            const { itemId } = req.params;
            const userId = req.session.user.id;

            // Check if user already has an active borrow for this item
            const existingBorrow = await BorrowRecord.findOne({
                user: userId,
                item: itemId,
                status: 'Dipinjam'
            });

            if (existingBorrow) {
                req.flash('error_msg', 'You have already borrowed this item');
                return res.redirect('back');
            }

            // Check if item can be borrowed
            const item = await Item.findById(itemId);
            if (!item || !item.canBeBorrowed()) {
                req.flash('error_msg', 'Item is not available for borrowing');
                return res.redirect('back');
            }

            // Create borrow record
            const borrowRecord = new BorrowRecord({
                user: userId,
                item: itemId
            });

            await borrowRecord.save();
            req.flash('success_msg', 'Item borrowed successfully');
            res.redirect('/user/borrows');
        } catch (error) {
            req.flash('error_msg', error.message);
            res.redirect('back');
        }
    },

    // View Borrow Status
    getBorrowStatus: async (req, res) => {
        try {
            const borrows = await BorrowRecord.find({
                user: req.session.user.id
            })
            .populate('item')
            .sort('-borrowDate');

            res.render('user/borrow-status', {
                title: 'Status Peminjaman',
                borrows
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading borrow status');
            res.redirect('/user/dashboard');
        }
    },

    // View Store Map
    getStoreMap: async (req, res) => {
        try {
            const mapPath = path.join(__dirname, '../public/uploads/maps/store-map.jpg');
            const mapExists = await fs.access(mapPath).then(() => true).catch(() => false);

            if (!mapExists) {
                req.flash('error_msg', 'Store map is not available');
                return res.redirect('/user/dashboard');
            }

            res.render('user/store-map', {
                title: 'Denah Tool Store',
                mapExists
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading store map');
            res.redirect('/user/dashboard');
        }
    },

    // Get Active Borrows (API endpoint for AJAX updates)
    getActiveBorrows: async (req, res) => {
        try {
            const activeBorrows = await BorrowRecord.find({
                user: req.session.user.id,
                status: 'Dipinjam'
            })
            .populate('item')
            .sort('-borrowDate');

            res.json(activeBorrows);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching active borrows' });
        }
    }
};

module.exports = userController;
