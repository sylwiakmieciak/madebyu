const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductComment = sequelize.define('ProductComment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'product_comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ProductComment;
};
