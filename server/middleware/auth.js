// ============================================
// AUTH MIDDLEWARE - JWT Verification
// ============================================
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('===== AUTH MIDDLEWARE =====');
  console.log('Path:', req.path);
  console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('Token valid, user:', decoded.id);
    req.user = decoded; // { id, email, username, role }
    next();
  } catch (error) {
    console.log('Token error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional auth - nie rzuca błędu jeśli brak tokenu
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
    next();
  } catch (error) {
    next(); // Kontynuuj nawet jeśli token niepoprawny
  }
};

// Admin role check
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

module.exports = { authMiddleware, optionalAuth, requireAdmin };
