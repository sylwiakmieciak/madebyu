// ============================================
// MADEBYU BACKEND SERVER
// ============================================
const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();
const { syncDatabase } = require('./models');
const passport = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true for HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const themeRoutes = require('./routes/themes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/themes', themeRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MadeByU API is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 MadeByU Backend Server           ║
║   📍 http://localhost:${PORT}         ║
║   🔥 Ready to accept requests         ║
╚════════════════════════════════════════╝
  `);

  // Synchronize database (force: true = DROP & RECREATE)
  // Change to false after first run to keep data
  await syncDatabase(false); // false = nie kasuj danych przy restarcie
});
