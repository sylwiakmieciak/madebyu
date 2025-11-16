// ============================================
// SEQUELIZE CONFIG - ORM Database Connection
// ============================================
const { Sequelize } = require('sequelize');
const path = require('path');

// Load .env from server directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'madebyu',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log('[OK] Database connected successfully (Sequelize)');
  })
  .catch(err => {
    console.error('[ERROR] Database connection failed:', err.message);
  });

module.exports = sequelize;
