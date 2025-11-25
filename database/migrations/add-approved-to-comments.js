const mysql = require('mysql2/promise');

async function addApprovedColumn() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'madebyu'
  });

  try {
    console.log('Adding approved column to product_comments...');
    
    // Dodaj kolumnę approved (domyślnie false - wymaga zatwierdzenia)
    await connection.execute(`
      ALTER TABLE product_comments 
      ADD COLUMN approved BOOLEAN DEFAULT FALSE AFTER comment
    `);

    console.log('✓ Column added successfully');
    
    // Opcjonalnie: zatwierdź wszystkie istniejące komentarze
    await connection.execute(`
      UPDATE product_comments SET approved = TRUE WHERE approved = FALSE
    `);
    
    console.log('✓ Existing comments auto-approved');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

addApprovedColumn();
