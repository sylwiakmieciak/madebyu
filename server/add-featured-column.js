// ============================================
// MIGRATION: Add is_featured column to products table
// ============================================
const mysql = require('mysql2/promise');

async function addFeaturedColumn() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'madebyu'
  });

  try {
    // Check if column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'madebyu' 
        AND TABLE_NAME = 'products' 
        AND COLUMN_NAME = 'is_featured'
    `);

    if (columns.length === 0) {
      console.log('Adding is_featured column...');
      await connection.query(`
        ALTER TABLE products 
        ADD COLUMN is_featured BOOLEAN DEFAULT false,
        ADD COLUMN featured_at DATETIME NULL
      `);
      console.log('✓ is_featured column added successfully');
    } else {
      console.log('✓ is_featured column already exists');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

addFeaturedColumn();
