// Konfiguracja polaczenia z baza danych MySQL

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'madebyu',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00'
});

// Test polaczenia
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✓ Polaczono z baza danych MySQL');
        connection.release();
        return true;
    } catch (error) {
        console.error('✗ Blad polaczenia z baza danych:', error.message);
        return false;
    }
}

// Helper do wykonywania zapytan
async function query(sql, params) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Blad zapytania SQL:', error);
        throw error;
    }
}

module.exports = {
    pool,
    query,
    testConnection
};
