const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const verifyToken = (req, res, next) => {
  console.log('🔐 Auth Middleware: Verifying token...');
  console.log('🔐 Auth Middleware: Authorization header:', req.headers.authorization);
  
  const token = req.headers.authorization?.split(' ')[1];
  console.log('🔐 Auth Middleware: Extracted token:', token ? `${token.substring(0, 20)}...` : 'No token');

  if (!token) {
    console.log('🔐 Auth Middleware: No token provided');
    return res.status(401).json({ 
      success: false, 
      error: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'psychemirror-secret-key');
    console.log('🔐 Auth Middleware: Decoded token:', decoded);
    
    // Verify user exists in database
    pool.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.userId])
      .then(result => {
        console.log('🔐 Auth Middleware: Database query result:', result.rows);
        
        if (result.rows.length === 0) {
          console.log('🔐 Auth Middleware: User not found in database');
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid token. User not found.' 
          });
        }
        
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
        console.log('🔐 Auth Middleware: Token verified successfully, user:', req.user);
        next();
      })
      .catch(error => {
        console.error('🔐 Auth Middleware: Database error in token verification:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Database error during token verification' 
        });
      });
  } catch (error) {
    console.error('🔐 Auth Middleware: Token verification error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Invalid token.' 
    });
  }
};

module.exports = {
  verifyToken
};
