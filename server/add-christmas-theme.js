const mysql = require('mysql2/promise');
require('dotenv').config();

async function addChristmasTheme() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'madebyu'
    });

    console.log('Dodawanie świątecznego motywu...');

    await connection.query(
      `INSERT INTO themes (name, primary_color, secondary_color, accent_color, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      ['Świąteczny', '#c41e3a', '#165b33', '#ffd700']
    );

    console.log('✅ Motyw świąteczny został dodany!');
    console.log('   Primary (czerwony): #c41e3a');
    console.log('   Secondary (zielony): #165b33');
    console.log('   Accent (złoty): #ffd700');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Błąd:', error);
    process.exit(1);
  }
}

addChristmasTheme();
