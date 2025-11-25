const mysql = require('mysql2/promise');

async function addUserPermissions() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'madebyu'
  });

  try {
    console.log('Adding permissions columns to users table...');
    
    // Dodaj kolumny uprawnień
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN can_moderate_products BOOLEAN DEFAULT FALSE AFTER is_moderator,
      ADD COLUMN can_moderate_comments BOOLEAN DEFAULT FALSE AFTER can_moderate_products,
      ADD COLUMN can_manage_themes BOOLEAN DEFAULT FALSE AFTER can_moderate_comments
    `);

    console.log('✓ Permissions columns added successfully');
    
    // Ustaw wszystkie uprawnienia dla istniejących adminów
    await connection.execute(`
      UPDATE users 
      SET can_moderate_products = TRUE, 
          can_moderate_comments = TRUE, 
          can_manage_themes = TRUE 
      WHERE role = 'admin'
    `);
    
    console.log('✓ Admin permissions updated');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await connection.end();
  }
}

addUserPermissions();
