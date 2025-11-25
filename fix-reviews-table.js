const { sequelize } = require('./server/models');

async function fixReviewsTable() {
  try {
    console.log('Dropping old reviews table...');
    await sequelize.query('DROP TABLE IF EXISTS reviews');
    console.log('✓ Old reviews table dropped');
    
    console.log('Creating new reviews table...');
    await sequelize.query(`
      CREATE TABLE reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        seller_id INT NOT NULL,
        buyer_id INT NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ New reviews table created');
    
    console.log('\nVerifying structure...');
    const [results] = await sequelize.query('DESCRIBE reviews');
    console.log('Columns:');
    results.forEach(r => console.log(`  - ${r.Field}: ${r.Type}`));
    
    console.log('\n✅ Reviews table fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixReviewsTable();
