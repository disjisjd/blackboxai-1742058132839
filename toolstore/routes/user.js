const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isUser } = require('../middleware/auth');

// Protect all user routes
router.use(isUser);

// Dashboard
router.get('/dashboard', userController.getDashboard);

// Rack and Items
router.get('/racks', userController.getRacks);
router.get('/racks/:rackId', userController.getRackItems);
router.post('/items/:itemId/borrow', userController.borrowItem);

// Borrow Status
router.get('/borrows', userController.getBorrowStatus);
router.get('/borrows/active', userController.getActiveBorrows); // AJAX endpoint

// Store Map
router.get('/map', userController.getStoreMap);

// Error handling middleware
router.use((err, req, res, next) => {
    console.error(err.stack);
    req.flash('error_msg', err.message || 'An error occurred');
    res.redirect('/user/dashboard');
});

module.exports = router;
