const mysql = require('mysql2/promise');
require('dotenv').config();

async function addGreetingColumn() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'madebyu'
    });

    console.log('Dodawanie kolumny greeting do tabeli users...');
    
    // Sprawdź czy kolumna już istnieje
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM users LIKE 'greeting'`
    );
    
    if (columns.length > 0) {
      console.log('✅ Kolumna greeting już istnieje');
    } else {
      await connection.query(
        `ALTER TABLE users ADD COLUMN greeting VARCHAR(500) NULL DEFAULT 'Witaj na moim profilu! 👋' AFTER bio`
      );
      console.log('✅ Kolumna greeting została dodana');
    }
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Błąd:', error);
    process.exit(1);
  }
}

addGreetingColumn();
