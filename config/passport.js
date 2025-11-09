// Konfiguracja Passport.js dla OAuth

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Serializacja uzytkownika
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserializacja uzytkownika
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Strategia Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Sprawdz czy uzytkownik juz istnieje
            let user = await User.findByOAuthId('google', profile.id);
            
            if (user) {
                // Uzytkownik istnieje - zaloguj i aktualizuj last_login
                await User.updateLastLogin(user.id);
                return done(null, user);
            }

            // Sprawdz czy email juz istnieje
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (email) {
                user = await User.findByEmail(email);
                if (user) {
                    // Email istnieje ale bez Google ID - polacz konta
                    return done(null, false, { message: 'Email juz istnieje. Zaloguj sie normalnie.' });
                }
            }

            // Utworz nowego uzytkownika
            const username = profile.displayName.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();
            
            const newUser = await User.create({
                email: email,
                username: username,
                oauthProvider: 'google',
                oauthId: profile.id,
                avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null
            });

            done(null, newUser);
        } catch (error) {
            console.error('Blad Google OAuth:', error);
            done(error, null);
        }
    }));
}

// Strategia GitHub OAuth
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || '/auth/github/callback',
        scope: ['user:email']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Sprawdz czy uzytkownik juz istnieje
            let user = await User.findByOAuthId('github', profile.id);
            
            if (user) {
                await User.updateLastLogin(user.id);
                return done(null, user);
            }

            // Pobierz email
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (email) {
                user = await User.findByEmail(email);
                if (user) {
                    return done(null, false, { message: 'Email juz istnieje. Zaloguj sie normalnie.' });
                }
            }

            // Utworz nowego uzytkownika
            const username = profile.username || (profile.displayName.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now());
            
            const newUser = await User.create({
                email: email,
                username: username,
                oauthProvider: 'github',
                oauthId: profile.id,
                avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null
            });

            done(null, newUser);
        } catch (error) {
            console.error('Blad GitHub OAuth:', error);
            done(error, null);
        }
    }));
}

module.exports = passport;
