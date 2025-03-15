const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest } = require('../middleware/auth');

// Admin Routes
router.get('/admin/signup', isGuest, authController.getAdminSignup);
router.post('/admin/signup', isGuest, authController.postAdminSignup);
router.get('/admin/login', isGuest, authController.getAdminLogin);
router.post('/admin/login', isGuest, authController.postAdminLogin);

// User Routes
router.get('/user/signup', isGuest, authController.getUserSignup);
router.post('/user/signup', isGuest, authController.postUserSignup);
router.get('/user/login', isGuest, authController.getUserLogin);
router.post('/user/login', isGuest, authController.postUserLogin);

// Logout Route (common for both admin and user)
router.get('/logout', authController.logout);

module.exports = router;
