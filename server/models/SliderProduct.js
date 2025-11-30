// ============================================
// SLIDER PRODUCT MODEL - Produkty w slajderze
// ============================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SliderProduct = sequelize.define('SliderProduct', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  slider_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sliders',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  display_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'slider_products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['slider_id'] },
    { fields: ['product_id'] },
    { fields: ['display_order'] }
  ]
});

module.exports = SliderProduct;
