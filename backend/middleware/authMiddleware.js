// middleware/authMiddleware.js
import { validateSession, getSession } from '../config/auth.js';

export const authenticateToken = (req, res, next) => {
  // Skip authentication for health check and auth routes
  if (req.path === '/api/health' || req.path.startsWith('/api/auth')) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const sessionId = authHeader && authHeader.split(' ')[1];

  if (!sessionId) {
    console.log('❌ No session ID provided for:', req.path);
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }

  // Validate session instead of JWT
  if (!validateSession(sessionId)) {
    console.log('❌ Invalid or expired session for:', req.path);
    return res.status(403).json({ 
      error: 'Invalid session',
      message: 'Your session has expired. Please login again.'
    });
  }

  // Get session data and attach to request
  const session = getSession(sessionId);
  req.user = { username: session.username };
  
  next();
};

// Alias for consistency
export const requireAuth = authenticateToken;