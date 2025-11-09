const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config();

const { generateCSSVariables } = require('./utils/cssGenerator');
const themeConfig = require('./config/theme.config');
const { testConnection } = require('./config/database');
const passport = require('./config/passport');
const { loadUser, isAuthenticated } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Ustawienie silnika widokow
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'twoj-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 godziny
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Middleware do ladowania uzytkownika (opcjonalnie)
app.use(loadUser);

// Dynamiczny endpoint dla CSS variables (pozniej z bazy danych)
app.get('/css/variables.css', (req, res) => {
  const css = generateCSSVariables(themeConfig);
  res.setHeader('Content-Type', 'text/css');
  res.send(css);
});

// Auth routes
app.use('/', authRoutes);

// Podstawowa trasa - strona glowna
app.get('/', (req, res) => {
  res.render('index', {
    title: 'MadeByU - Marketplace Rekodziel',
    user: req.user || null
  });
});

// Strona produktow
app.get('/products', (req, res) => {
  res.render('products', {
    title: 'Wszystkie Produkty',
    user: req.user || null
  });
});

// Dashboard (wymaga logowania)
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard',
    user: req.user,
    welcome: req.query.welcome || null
  });
});

// Start serwera
async function startServer() {
  // Test polaczenia z baza
  await testConnection();
  
  app.listen(PORT, () => {
    console.log(`Serwer dziala na http://localhost:${PORT}`);
  });
}

startServer();
