// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.flash('error_msg', 'Please log in to access this page');
    res.redirect('/auth/login');
};

// Admin authentication middleware
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    req.flash('error_msg', 'Access denied. Admin privileges required.');
    res.redirect('/auth/login');
};

// User authentication middleware
const isUser = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'user') {
        return next();
    }
    req.flash('error_msg', 'Access denied. User privileges required.');
    res.redirect('/auth/login');
};

// Guest middleware (not logged in)
const isGuest = (req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    res.redirect(req.session.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
};

// File upload middleware
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(new Error('Only JPG files are allowed'), false);
    }
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isUser,
    isGuest,
    fileFilter
};
