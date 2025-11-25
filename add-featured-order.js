// Skrypt do dodania kolumny featured_order do tabeli products
const { sequelize } = require('./server/models');

async function addFeaturedOrderColumn() {
  try {
    console.log('Dodawanie kolumny featured_order...');
    
    await sequelize.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS featured_order INT DEFAULT NULL
    `);
    
    console.log('✓ Kolumna featured_order dodana pomyślnie');
    process.exit(0);
  } catch (error) {
    console.error('Błąd podczas dodawania kolumny:', error);
    process.exit(1);
  }
}

addFeaturedOrderColumn();
