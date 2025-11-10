// ============================================
// MODELS INDEX - Import wszystkich modeli i relacje
// ============================================
const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Theme = require('./Theme');
const UserTheme = require('./UserTheme');

// ============================================
// RELATIONSHIPS - Relacje między modelami
// ============================================

// User -> Products (1:N)
User.hasMany(Product, { foreignKey: 'user_id', as: 'products' });
Product.belongsTo(User, { foreignKey: 'user_id', as: 'seller' });

// Category -> Products (1:N)
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Product -> ProductImages (1:N)
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User -> Orders (1:N)
User.hasMany(Order, { foreignKey: 'buyer_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'buyer_id', as: 'buyer' });

// Order -> OrderItems (1:N)
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Product -> OrderItems (1:N)
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User (seller) -> OrderItems (1:N)
User.hasMany(OrderItem, { foreignKey: 'seller_id', as: 'sales' });
OrderItem.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });

// Theme -> UserThemes (1:N)
Theme.hasMany(UserTheme, { foreignKey: 'theme_id', as: 'userThemes' });
UserTheme.belongsTo(Theme, { foreignKey: 'theme_id', as: 'theme' });

// User -> UserTheme (1:1)
User.hasOne(UserTheme, { foreignKey: 'user_id', as: 'selectedTheme' });
UserTheme.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User (creator) -> Themes (1:N)
User.hasMany(Theme, { foreignKey: 'created_by', as: 'createdThemes' });
Theme.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ============================================
// SYNC DATABASE - Synchronizacja z bazą
// ============================================
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force }); // force: true = DROP & CREATE
    console.log('✅ Database synchronized');
    
    // Zawsze sprawdź czy są podstawowe dane
    await seedCategories();
    await seedThemes();
    
    // Admin tylko przy force
    if (force) {
      await seedAdmin();
    }
  } catch (error) {
    console.error('❌ Database sync failed:', error);
  }
};

// ============================================
// SEED CATEGORIES - Dodaj podstawowe kategorie
// ============================================
const seedCategories = async () => {
  try {
    const count = await Category.count();
    if (count > 0) return; // Już są kategorie

    const categories = [
      { name: 'Ceramika', slug: 'ceramika', display_order: 1 },
      { name: 'Biżuteria', slug: 'bizuteria', display_order: 2 },
      { name: 'Drewno', slug: 'drewno', display_order: 3 },
      { name: 'Tekstylia', slug: 'tekstylia', display_order: 4 }
    ];

    await Category.bulkCreate(categories);
    console.log('✅ Categories seeded');
  } catch (error) {
    console.error('❌ Seed categories failed:', error);
  }
};

// ============================================
// SEED THEMES - Dodaj domyślne motywy
// ============================================
const seedThemes = async () => {
  try {
    const count = await Theme.count();
    if (count > 0) return; // Już są motywy

    const themes = [
      {
        name: 'Klasyczny Brązowy',
        slug: 'classic-brown',
        primary_color: '#8b6f47',
        secondary_color: '#a0826d',
        accent_color: '#c9a882',
        is_default: true,
        is_active: true
      },
      {
        name: 'Morski Niebieski',
        slug: 'ocean-blue',
        primary_color: '#2c5f8d',
        secondary_color: '#3d7ba8',
        accent_color: '#5ea3d0',
        is_default: false,
        is_active: true
      },
      {
        name: 'Leśna Zieleń',
        slug: 'forest-green',
        primary_color: '#3d5a3c',
        secondary_color: '#527d50',
        accent_color: '#79a677',
        is_default: false,
        is_active: true
      }
    ];

    await Theme.bulkCreate(themes);
    console.log('✅ Themes seeded');
  } catch (error) {
    console.error('❌ Seed themes failed:', error);
  }
};

// ============================================
// SEED ADMIN - Dodaj admina (hasło: admin123)
// ============================================
const seedAdmin = async () => {
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await User.create({
      username: 'admin',
      email: 'admin@madebyu.pl',
      password: hashedPassword,
      full_name: 'Administrator',
      role: 'admin',
      email_verified: true
    });

    console.log('✅ Admin user created (admin@madebyu.pl / admin123)');
  } catch (error) {
    console.error('❌ Seed admin failed:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductImage,
  Order,
  OrderItem,
  Theme,
  UserTheme,
  syncDatabase
};
