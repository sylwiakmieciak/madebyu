// ============================================
// AUTH ROUTES - Rejestracja, Logowanie
// ============================================
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Konfiguracja multer dla uploadu avatarów
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tylko pliki graficzne są dozwolone (jpeg, jpg, png, gif, webp)'));
    }
  }
});

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
      attributes: [
        'id', 'username', 'email', 'role', 'full_name', 'avatar_url', 'bio', 'greeting',
        'can_moderate_products', 'can_moderate_comments', 'can_manage_themes',
        'created_at'
      ]
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
// GET /api/auth/user/:userId - Pobierz publiczny profil użytkownika
// ============================================
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: ['id', 'username', 'full_name', 'avatar_url', 'bio', 'greeting', 'created_at']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// ============================================
// POST /api/auth/upload-avatar - Upload avatara
// ============================================
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku' });
    }

    // Zwróć pełny URL do pliku
    const avatar_url = `http://localhost:3001/uploads/avatars/${req.file.filename}`;
    
    console.log('Avatar uploaded:', avatar_url);
    
    res.json({ 
      message: 'Zdjęcie przesłane pomyślnie',
      avatar_url 
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Nie udało się przesłać zdjęcia' });
  }
});

// ============================================
// PUT /api/auth/profile - Aktualizuj profil użytkownika
// ============================================
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, full_name, avatar_url, bio, greeting } = req.body;

    // Walidacja
    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: 'Nazwa użytkownika jest wymagana' });
    }

    // Sprawdź czy username nie jest już zajęty (przez innego użytkownika)
    const existingUser = await User.findOne({
      where: { 
        username,
        id: { [require('sequelize').Op.ne]: req.user.id }
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Ta nazwa użytkownika jest już zajęta' });
    }

    // Aktualizuj dane użytkownika
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    user.username = username.trim();
    user.full_name = full_name?.trim() || null;
    user.avatar_url = avatar_url?.trim() || null;
    user.bio = bio?.trim() || null;
    user.greeting = greeting?.trim() || 'Witaj na moim profilu! 👋';

    await user.save();

    res.json({ 
      message: 'Profil zaktualizowany pomyślnie',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        greeting: user.greeting,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować profilu' });
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
