// Kontroler autentykacji

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generowanie JWT tokenu
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

class AuthController {
    // GET /login
    static async showLoginForm(req, res) {
        if (req.user) {
            return res.redirect('/dashboard');
        }
        res.render('login', { 
            title: 'Zaloguj sie',
            user: null,
            error: req.query.error || null,
            success: req.query.success || null
        });
    }

    // GET /register
    static async showRegisterForm(req, res) {
        if (req.user) {
            return res.redirect('/dashboard');
        }
        res.render('register', { 
            title: 'Rejestracja',
            user: null,
            error: req.query.error || null
        });
    }

    // POST /auth/register
    static async register(req, res) {
        try {
            // Walidacja
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.redirect('/register?error=' + encodeURIComponent(errors.array()[0].msg));
            }

            const { email, password, username } = req.body;

            // Sprawdz czy email istnieje
            const existingEmail = await User.findByEmail(email);
            if (existingEmail) {
                return res.redirect('/register?error=' + encodeURIComponent('Email juz istnieje'));
            }

            // Sprawdz czy username istnieje
            const existingUsername = await User.findByUsername(username);
            if (existingUsername) {
                return res.redirect('/register?error=' + encodeURIComponent('Nazwa uzytkownika jest zajeta'));
            }

            // Utworz uzytkownika
            const user = await User.create({
                email,
                password,
                username
            });

            // Zaloguj do sesji Passport
            req.login(user, (err) => {
                if (err) {
                    console.error('Blad logowania po rejestracji:', err);
                    return res.redirect('/login?success=' + encodeURIComponent('Konto utworzone. Zaloguj sie.'));
                }
                
                // Update last login
                User.updateLastLogin(user.id);
                res.redirect('/dashboard?welcome=1');
            });
        } catch (error) {
            console.error('Blad rejestracji:', error);
            res.redirect('/register?error=' + encodeURIComponent('Wystapil blad. Sprobuj ponownie.'));
        }
    }

    // POST /auth/login
    static async login(req, res) {
        try {
            const { email, password, remember } = req.body;

            // Znajdz uzytkownika
            const user = await User.findByEmail(email);
            if (!user) {
                return res.redirect('/login?error=' + encodeURIComponent('Nieprawidlowy email lub haslo'));
            }

            // Sprawdz haslo (tylko dla lokalnych kont)
            if (user.oauth_provider === 'local') {
                const isValidPassword = await User.comparePassword(password, user.password);
                if (!isValidPassword) {
                    return res.redirect('/login?error=' + encodeURIComponent('Nieprawidlowy email lub haslo'));
                }
            } else {
                return res.redirect('/login?error=' + encodeURIComponent('To konto uzywa logowania przez ' + user.oauth_provider));
            }

            // Zaloguj do sesji Passport
            req.login(user, (err) => {
                if (err) {
                    console.error('Blad logowania:', err);
                    return res.redirect('/login?error=' + encodeURIComponent('Wystapil blad. Sprobuj ponownie.'));
                }
                
                // Update last login
                User.updateLastLogin(user.id);
                res.redirect('/dashboard');
            });
        } catch (error) {
            console.error('Blad logowania:', error);
            res.redirect('/login?error=' + encodeURIComponent('Wystapil blad. Sprobuj ponownie.'));
        }
    }

    // GET /logout
    static async logout(req, res) {
        req.logout((err) => {
            if (err) {
                console.error('Blad wylogowania:', err);
            }
            req.session.destroy(() => {
                res.clearCookie('connect.sid');
                res.redirect('/?success=' + encodeURIComponent('Wylogowano pomyslnie'));
            });
        });
    }
}

module.exports = AuthController;
