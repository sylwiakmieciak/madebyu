// Test Passport OAuth setup
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('\n=== PASSPORT OAUTH TEST ===');
console.log('Google OAuth configured:', !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET));
console.log('GitHub OAuth configured:', !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET));

// Try to require passport config
try {
  const passport = require('./config/passport');
  console.log('✅ Passport config loaded successfully');
  
  // Check if strategies are registered
  console.log('Registered strategies:', passport._strategies ? Object.keys(passport._strategies) : 'none');
} catch (error) {
  console.error('❌ Passport config error:', error.message);
}

console.log('===========================\n');
