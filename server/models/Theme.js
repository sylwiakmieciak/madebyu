// ============================================
// THEME MODEL - Model motywów
// ============================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Theme = sequelize.define('Theme', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  // 3 główne kolory - reszta będzie wyliczana
  primary_color: {
    type: DataTypes.STRING(7), // #RRGGBB
    allowNull: false,
    defaultValue: '#8b6f47'
  },
  secondary_color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#a0826d'
  },
  accent_color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#c9a882'
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'themes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['slug'] },
    { fields: ['is_default'] }
  ]
});

module.exports = Theme;
