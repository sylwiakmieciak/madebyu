// Skrypt do dodania systemu moderacji
const { sequelize } = require('./server/models');

async function addModerationSystem() {
  try {
    console.log('Dodawanie systemu moderacji...');
    
    // Dodaj kolumny do tabeli products
    await sequelize.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS moderated_by INT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS moderated_at DATETIME DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL
    `);
    
    console.log('✓ Kolumny moderacji dodane do products');
    
    // Dodaj kolumny do tabeli users dla moderatorów
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS moderation_categories TEXT DEFAULT NULL
    `);
    
    console.log('✓ Kolumny moderacji dodane do users');
    
    // Zaktualizuj istniejące produkty jako zaakceptowane
    await sequelize.query(`
      UPDATE products 
      SET moderation_status = 'approved' 
      WHERE moderation_status IS NULL OR status = 'published'
    `);
    
    console.log('✓ Istniejące produkty oznaczone jako zaakceptowane');
    
    process.exit(0);
  } catch (error) {
    console.error('Błąd podczas dodawania systemu moderacji:', error);
    process.exit(1);
  }
}

addModerationSystem();
