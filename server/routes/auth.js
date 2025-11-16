// ============================================
// AUTH ROUTES - Rejestracja, Logowanie
// ============================================
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ============================================
// POST /api/auth/register - Rejestracja
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Walidacja
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Sprawdź czy użytkownik już istnieje
    const existing = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [{ email }, { username }]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash hasła
    const hashedPassword = await bcrypt.hash(password, 10);

    // Dodaj użytkownika
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    const userId = user.id;

    // Stwórz token JWT
    const token = jwt.sign(
      { id: userId, email, username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: userId, username, email, role: 'user' }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============================================
// POST /api/auth/login - Logowanie
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Znajdź użytkownika
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sprawdź hasło
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Stwórz token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last_login
    await user.update({ last_login: new Date() });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// GET /api/auth/me - Pobierz dane użytkownika
// ============================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'role', 'avatar_url', 'bio', 'created_at']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// ============================================
// GOOGLE OAUTH
// ============================================
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:5173/login?error=google_auth_failed',
    session: true 
  }),
  (req, res) => {
    try {
      // Sprawdź czy użytkownik jest zalogowany
      if (!req.user) {
        return res.redirect('http://localhost:5173/login?error=no_user');
      }

      // Sukces - stwórz JWT token
      const token = jwt.sign(
        { 
          id: req.user.id, 
          email: req.user.email, 
          username: req.user.username, 
          role: req.user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect do frontendu z tokenem
      res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('http://localhost:5173/login?error=token_generation_failed');
    }
  }
);

// ============================================
// GITHUB OAUTH
// ============================================
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { 
    failureRedirect: 'http://localhost:5173/login?error=github_auth_failed',
    session: true 
  }),
  (req, res) => {
    try {
      // Sprawdź czy użytkownik jest zalogowany
      if (!req.user) {
        return res.redirect('http://localhost:5173/login?error=no_user');
      }

      // Sukces - stwórz JWT token
      const token = jwt.sign(
        { 
          id: req.user.id, 
          email: req.user.email, 
          username: req.user.username, 
          role: req.user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect do frontendu z tokenem
      res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.redirect('http://localhost:5173/login?error=token_generation_failed');
    }
  }
);

module.exports = router;
