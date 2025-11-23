// ============================================
// SCRIPT: Set user as admin
// Usage: node set-admin.js <email>
// ============================================
const mysql = require('mysql2/promise');

async function setAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: node set-admin.js <email>');
    console.log('Example: node set-admin.js user@example.com');
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'madebyu'
  });

  try {
    // Check if user exists
    const [users] = await connection.query(
      'SELECT id, username, email, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    const user = users[0];
    console.log('Found user:', user.username, '(' + user.email + ')');
    console.log('Current role:', user.role);

    // Update role to admin
    await connection.query(
      'UPDATE users SET role = ? WHERE email = ?',
      ['admin', email]
    );

    console.log('✓ User role updated to admin');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

setAdmin();
