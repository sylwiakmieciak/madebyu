// ============================================
// PASSPORT CONFIG - Google & GitHub OAuth
// ============================================
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { User } = require('../models');

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ============================================
// GOOGLE STRATEGY
// ============================================
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Sprawdź czy user istnieje
      let user = await User.findOne({ where: { google_id: profile.id } });

      if (!user) {
        // Stwórz nowego użytkownika
        user = await User.create({
          google_id: profile.id,
          email: profile.emails[0].value,
          username: profile.emails[0].value.split('@')[0] + '_' + Date.now(),
          full_name: profile.displayName,
          avatar_url: profile.photos[0]?.value,
          oauth_provider: 'google',
          email_verified: true
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// ============================================
// GITHUB STRATEGY
// ============================================
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Sprawdź czy user istnieje
      let user = await User.findOne({ where: { github_id: profile.id } });

      if (!user) {
        // Pobierz email z profilu
        const email = profile.emails && profile.emails[0] 
          ? profile.emails[0].value 
          : `${profile.username}@github.com`;

        // Stwórz nowego użytkownika
        user = await User.create({
          github_id: profile.id,
          email: email,
          username: profile.username || profile.displayName.replace(/\s+/g, '_').toLowerCase(),
          full_name: profile.displayName,
          avatar_url: profile.photos[0]?.value,
          oauth_provider: 'github',
          email_verified: true
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

module.exports = passport;
