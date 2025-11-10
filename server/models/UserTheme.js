// ============================================
// USER THEME MODEL - Wybrane motywy użytkowników
// ============================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserTheme = sequelize.define('UserTheme', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  theme_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'themes',
      key: 'id'
    }
  }
}, {
  tableName: 'user_themes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['theme_id'] }
  ]
});

module.exports = UserTheme;
