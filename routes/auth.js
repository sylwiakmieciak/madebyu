// Routes dla autentykacji

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const AuthController = require('../controllers/AuthController');
const { body } = require('express-validator');

// Walidatory
const registerValidation = [
    body('email').isEmail().withMessage('Nieprawidlowy adres email'),
    body('username')
        .isLength({ min: 3, max: 20 }).withMessage('Nazwa uzytkownika: 3-20 znakow')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Nazwa uzytkownika: tylko litery, cyfry i podkreslnik'),
    body('password')
        .isLength({ min: 8 }).withMessage('Haslo musi miec minimum 8 znakow'),
    body('password_confirm')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Hasla nie sa identyczne')
];

// GET /login
router.get('/login', AuthController.showLoginForm);

// GET /register
router.get('/register', AuthController.showRegisterForm);

// POST /auth/register
router.post('/auth/register', registerValidation, AuthController.register);

// POST /auth/login
router.post('/auth/login', AuthController.login);

// GET /logout
router.get('/logout', AuthController.logout);

// Google OAuth
router.get('/auth/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email']
    })
);

router.get('/auth/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/login?error=' + encodeURIComponent('Blad logowania przez Google')
    }),
    (req, res) => {
        // Sukces - przekieruj do dashboardu
        res.redirect('/dashboard');
    }
);

// GitHub OAuth
router.get('/auth/github',
    passport.authenticate('github', { 
        scope: ['user:email']
    })
);

router.get('/auth/github/callback',
    passport.authenticate('github', { 
        failureRedirect: '/login?error=' + encodeURIComponent('Blad logowania przez GitHub')
    }),
    (req, res) => {
        // Sukces - przekieruj do dashboardu
        res.redirect('/dashboard');
    }
);

module.exports = router;
