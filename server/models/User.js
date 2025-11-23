// ============================================
// USER MODEL - Model użytkownika
// ============================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true // NULL for OAuth users
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  greeting: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: 'Witaj na moim profilu! 👋'
  },
  role: {
    type: DataTypes.ENUM('user', 'moderator', 'admin'),
    defaultValue: 'user'
  },
  // OAuth fields
  google_id: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true
  },
  github_id: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true
  },
  oauth_provider: {
    type: DataTypes.ENUM('local', 'google', 'github'),
    defaultValue: 'local'
  },
  // Email verification
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // Password reset
  reset_password_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Account status
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_banned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ban_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['email'] },
    { fields: ['username'] },
    { fields: ['role'] }
  ]
});

module.exports = User;
