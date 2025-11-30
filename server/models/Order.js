// ORDER MODEL - Model zamówienia

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_number: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  buyer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Shipping info
  shipping_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  shipping_email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  shipping_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  shipping_address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  shipping_city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  shipping_postal_code: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  shipping_country: {
    type: DataTypes.STRING(100),
    defaultValue: 'Polska'
  },
  // Payment info
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  payment_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  stripe_payment_intent_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  stripe_session_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // Order status
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['buyer_id'] },
    { fields: ['status'] },
    { fields: ['payment_status'] }
  ]
});

module.exports = Order;
