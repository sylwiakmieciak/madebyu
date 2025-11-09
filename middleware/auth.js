// Middleware autentykacji

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware sprawdzajacy czy uzytkownik jest zalogowany
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login?error=' + encodeURIComponent('Musisz byc zalogowany'));
}

// Middleware sprawdzajacy czy uzytkownik jest zalogowany (opcjonalnie)
function loadUser(req, res, next) {
    if (req.isAuthenticated()) {
        res.locals.user = req.user;
    } else {
        res.locals.user = null;
    }
    next();
}

// Middleware sprawdzajacy role
function hasRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.redirect('/login');
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).render('error', {
                title: 'Brak dostepu',
                message: 'Nie masz uprawnien do tej strony',
                user: req.user
            });
        }

        next();
    };
}

// Middleware sprawdzajacy czy uzytkownik jest adminem
function isAdmin(req, res, next) {
    return hasRole('admin')(req, res, next);
}

// Middleware sprawdzajacy czy uzytkownik jest moderatorem lub adminem
function isModerator(req, res, next) {
    return hasRole('moderator', 'admin')(req, res, next);
}

module.exports = {
    isAuthenticated,
    loadUser,
    hasRole,
    isAdmin,
    isModerator
};
