const { sequelize } = require('./server/models');

async function addProductComments() {
  try {
    console.log('Dodawanie systemu komentarzy produktów...');
    
    await sequelize.authenticate();
    console.log('[OK] Database connected successfully (Sequelize)');

    // Tworzenie tabeli product_comments
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS product_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_product_comments_product (product_id),
        INDEX idx_product_comments_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Tabela product_comments utworzona');

    await sequelize.close();
    console.log('[OK] Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[ERROR]', error.message);
    process.exit(1);
  }
}

addProductComments();
