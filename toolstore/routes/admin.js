const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');
const { isAdmin, fileFilter } = require('../middleware/auth');

// Multer configuration for map uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads/maps'));
    },
    filename: (req, file, cb) => {
        cb(null, 'store-map.jpg');
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Protect all admin routes
router.use(isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Item Management
router.get('/items', adminController.getItems);
router.post('/items/add', adminController.addItem);
router.post('/items/edit', adminController.editItem);
router.delete('/items/:id', adminController.deleteItem);

// Borrow Management
router.get('/borrows', adminController.getBorrows);
router.post('/borrows/:id/return', adminController.markAsReturned);

// Store Map Management
router.get('/map', adminController.getMap);
router.post('/map/upload', upload.single('map'), adminController.uploadMap);

// User Management
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);

// Lost Items Management
router.get('/lost-items', adminController.getLostItems);
router.post('/items/:id/mark-lost', adminController.markAsLost);
router.post('/items/:id/add-stock', adminController.addStock);

// Error handler for file uploads
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            req.flash('error_msg', 'File is too large. Maximum size is 5MB');
        } else {
            req.flash('error_msg', 'Error uploading file');
        }
        return res.redirect('/admin/map');
    } else if (error) {
        req.flash('error_msg', error.message || 'Only JPG files are allowed');
        return res.redirect('/admin/map');
    }
    next();
});

module.exports = router;
