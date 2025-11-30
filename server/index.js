// ============================================
// MADEBYU BACKEND SERVER
// ============================================
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

// Load .env from server directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { syncDatabase } = require('./models');
const sequelize = require('./config/database');
const passport = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));

// WAŻNE: Webhook Stripe musi być PRZED express.json()
app.post('/api/payments/webhook', 
  express.raw({ type: 'application/json' }), 
  require('./routes/payments')
);

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

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
const galleryRoutes = require('./routes/gallery');
const orderRoutes = require('./routes/orders');
const notificationRoutes = require('./routes/notifications');
const reviewRoutes = require('./routes/reviews');
const moderationRoutes = require('./routes/moderation');
const adminRoutes = require('./routes/admin');
const commentRoutes = require('./routes/comments');
const sliderRoutes = require('./routes/sliders');
const paymentRoutes = require('./routes/payments');
const cartRoutes = require('./routes/cart');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/sliders', sliderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cart', cartRoutes);

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
║   MadeByU Backend Server              ║
║   http://localhost:${PORT}            ║
║   Ready to accept requests            ║
╚════════════════════════════════════════╝
  `);

  // Synchronize database (force: true = DROP & RECREATE)
  // Change to false after first run to keep data
  await syncDatabase(false); // false = nie kasuj danych przy restarcie
  
  // Dodaj kolumnę order_id do notifications jeśli nie istnieje
  try {
    await sequelize.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS order_id INT NULL,
      ADD CONSTRAINT fk_notifications_order 
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
    `);
    console.log('[OK] Notifications table updated');
  } catch (error) {
    // Kolumna już istnieje
    console.log('[INFO] Notifications table already up to date');
  }

  // Dodaj kolumny first_name i last_name do users jeśli nie istnieją
  try {
    // Sprawdź czy kolumny istnieją
    const [columns] = await sequelize.query(`SHOW COLUMNS FROM users LIKE 'first_name'`);
    
    if (columns.length === 0) {
      // Dodaj kolumny
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN first_name VARCHAR(100) NULL AFTER full_name,
        ADD COLUMN last_name VARCHAR(100) NULL AFTER first_name;
      `);
      console.log('[OK] Users table updated with first_name and last_name');
    } else {
      console.log('[INFO] Users first_name/last_name columns already exist');
    }
  } catch (error) {
    console.error('[ERROR] Failed to add first_name/last_name columns:', error.message);
  }
});
