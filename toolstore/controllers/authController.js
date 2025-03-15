const Admin = require('../models/Admin');
const User = require('../models/User');

const authController = {
    // Admin Authentication
    getAdminSignup: async (req, res) => {
        try {
            const adminExists = await Admin.adminExists();
            if (adminExists) {
                req.flash('error_msg', 'Admin account already exists');
                return res.redirect('/auth/admin/login');
            }
            res.render('auth/admin-signup', { title: 'Admin Sign Up' });
        } catch (error) {
            req.flash('error_msg', 'Server error');
            res.redirect('/');
        }
    },

    postAdminSignup: async (req, res) => {
        try {
            const { username, password, nim, yearOfEnrollment } = req.body;

            // Validate fixed values
            if (username !== 'TSABPNJ' || 
                nim !== '20001' || 
                parseInt(yearOfEnrollment) !== 2001) {
                req.flash('error_msg', 'Invalid admin credentials');
                return res.redirect('/auth/admin/signup');
            }

            const adminExists = await Admin.adminExists();
            if (adminExists) {
                req.flash('error_msg', 'Admin account already exists');
                return res.redirect('/auth/admin/login');
            }

            const admin = new Admin({
                username,
                password,
                nim,
                yearOfEnrollment
            });

            await admin.save();
            req.flash('success_msg', 'Admin account created successfully');
            res.redirect('/auth/admin/login');
        } catch (error) {
            req.flash('error_msg', error.message);
            res.redirect('/auth/admin/signup');
        }
    },

    getAdminLogin: (req, res) => {
        res.render('auth/admin-login', { title: 'Admin Login' });
    },

    postAdminLogin: async (req, res) => {
        try {
            const { username, password } = req.body;
            const admin = await Admin.findOne({ username });

            if (!admin || !(await admin.comparePassword(password))) {
                req.flash('error_msg', 'Invalid Username or Password');
                return res.redirect('/auth/admin/login');
            }

            req.session.user = {
                id: admin._id,
                username: admin.username,
                role: 'admin'
            };

            res.redirect('/admin/dashboard');
        } catch (error) {
            req.flash('error_msg', 'Login error');
            res.redirect('/auth/admin/login');
        }
    },

    // User Authentication
    getUserSignup: (req, res) => {
        res.render('auth/user-signup', { title: 'User Sign Up' });
    },

    postUserSignup: async (req, res) => {
        try {
            const { username, nama, nim, angkatan, email, password } = req.body;

            // Check if username or email exists
            const usernameExists = await User.usernameExists(username);
            const emailExists = await User.emailExists(email);

            if (usernameExists || emailExists) {
                req.flash('error_msg', 'Username or Email already exists');
                return res.redirect('/auth/user/signup');
            }

            const user = new User({
                username,
                nama,
                nim,
                angkatan,
                email,
                password
            });

            await user.save();
            req.flash('success_msg', 'Registration successful. Please login.');
            res.redirect('/auth/user/login');
        } catch (error) {
            req.flash('error_msg', error.message);
            res.redirect('/auth/user/signup');
        }
    },

    getUserLogin: (req, res) => {
        res.render('auth/user-login', { title: 'User Login' });
    },

    postUserLogin: async (req, res) => {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username });

            if (!user || !(await user.comparePassword(password))) {
                req.flash('error_msg', 'Invalid Username or Password');
                return res.redirect('/auth/user/login');
            }

            if (!user.isActive) {
                req.flash('error_msg', 'Your account has been deactivated');
                return res.redirect('/auth/user/login');
            }

            req.session.user = {
                id: user._id,
                username: user.username,
                nama: user.nama,
                role: 'user'
            };

            res.redirect('/user/dashboard');
        } catch (error) {
            req.flash('error_msg', 'Login error');
            res.redirect('/auth/user/login');
        }
    },

    // Logout
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
            res.redirect('/');
        });
    }
};

module.exports = authController;
