// MODELS INDEX - Import wszystkich modeli i relacje

const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Theme = require('./Theme');
const UserTheme = require('./UserTheme');
const Gallery = require('./Gallery');
const Notification = require('./Notification');
const Review = require('./Review');
const ProductComment = require('./ProductComment')(sequelize);
const Slider = require('./Slider');
const SliderProduct = require('./SliderProduct');


// RELATIONSHIPS - Relacje między modelami

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

// User (moderator) -> Products (1:N)
User.hasMany(Product, { foreignKey: 'moderated_by', as: 'moderatedProducts' });
Product.belongsTo(User, { foreignKey: 'moderated_by', as: 'moderator' });

// Theme -> UserThemes (1:N)
Theme.hasMany(UserTheme, { foreignKey: 'theme_id', as: 'userThemes' });
UserTheme.belongsTo(Theme, { foreignKey: 'theme_id', as: 'theme' });

// User -> UserTheme (1:1)
User.hasOne(UserTheme, { foreignKey: 'user_id', as: 'activeTheme' });
UserTheme.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User -> Gallery (1:N)
User.hasMany(Gallery, { foreignKey: 'user_id', as: 'gallery' });
Gallery.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User (creator) -> Themes (1:N)
User.hasMany(Theme, { foreignKey: 'created_by', as: 'createdThemes' });
Theme.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// User -> Notifications (1:N)
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Order -> Notifications (1:N)
Order.hasMany(Notification, { foreignKey: 'order_id', as: 'notifications' });
Notification.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// User (seller) -> Reviews (1:N)
User.hasMany(Review, { foreignKey: 'seller_id', as: 'receivedReviews' });
Review.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });

// User (buyer) -> Reviews (1:N)
User.hasMany(Review, { foreignKey: 'buyer_id', as: 'givenReviews' });
Review.belongsTo(User, { foreignKey: 'buyer_id', as: 'buyer' });

// Order -> Reviews (1:N)
Order.hasMany(Review, { foreignKey: 'order_id', as: 'reviews' });
Review.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Product -> ProductComments (1:N)
Product.hasMany(ProductComment, { foreignKey: 'product_id', as: 'comments' });
ProductComment.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User -> ProductComments (1:N)
User.hasMany(ProductComment, { foreignKey: 'user_id', as: 'productComments' });
ProductComment.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// User (creator) -> Sliders (1:N)
User.hasMany(Slider, { foreignKey: 'created_by', as: 'createdSliders' });
Slider.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Slider -> SliderProducts (1:N)
Slider.hasMany(SliderProduct, { foreignKey: 'slider_id', as: 'sliderProducts' });
SliderProduct.belongsTo(Slider, { foreignKey: 'slider_id', as: 'slider' });

// Product -> SliderProducts (1:N)
Product.hasMany(SliderProduct, { foreignKey: 'product_id', as: 'sliderProducts' });
SliderProduct.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });


// SYNC DATABASE - Synchronizacja z bazą

const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force }); // force: true = DROP & CREATE
    console.log('[OK] Database synchronized');
    
    // Zawsze sprawdz czy sa podstawowe dane
    await seedCategories();
    await seedThemes();
    
    // Admin tylko przy force
    if (force) {
      await seedAdmin();
    }
  } catch (error) {
    console.error('[ERROR] Database sync failed:', error);
  }
};


// SEED CATEGORIES - Dodaj podstawowe kategorie

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
    console.log('[OK] Categories seeded');
  } catch (error) {
    console.error('[ERROR] Seed categories failed:', error);
  }
};


// SEED THEMES - Dodaj domyślne motywy

const seedThemes = async () => {
  try {
    const count = await Theme.count();
    if (count > 0) {
      // Sprawdź czy jest motyw świąteczny
      const christmasTheme = await Theme.findOne({ where: { slug: 'christmas' } });
      if (!christmasTheme) {
        await Theme.create({
          name: 'Świąteczny',
          slug: 'christmas',
          primary_color: '#c41e3a',
          secondary_color: '#165b33',
          accent_color: '#ffd700',
          is_default: false,
          is_active: true
        });
        console.log('[OK] Christmas theme added');
      }
      return; // Już są motywy
    }

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
      },
      {
        name: 'Świąteczny',
        slug: 'christmas',
        primary_color: '#c41e3a',
        secondary_color: '#165b33',
        accent_color: '#ffd700',
        is_default: false,
        is_active: true
      }
    ];

    await Theme.bulkCreate(themes);
    console.log('[OK] Themes seeded');
  } catch (error) {
    console.error('[ERROR] Seed themes failed:', error);
  }
};


// SEED ADMIN - Dodaj admina (hasło: admin123)

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

    console.log('[OK] Admin user created (admin@madebyu.pl / admin123)');
  } catch (error) {
    console.error('[ERROR] Seed admin failed:', error);
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
  Gallery,
  Notification,
  Review,
  ProductComment,
  Slider,
  SliderProduct,
  syncDatabase
};
