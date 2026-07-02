// routes/auth.js - Auth Routes
import express from 'express';
import { 
  authenticateAdmin, 
  createSession, 
  removeSession, 
  validateSession,
  getSession 
} from '../config/auth.js'; // Fixed import path

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password required'
      });
    }

    if (authenticateAdmin(username, password)) {
      const sessionId = createSession(username);
      
      res.json({
        success: true,
        sessionId: sessionId,
        user: { username: username }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/logout', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const sessionId = authHeader && authHeader.split(' ')[1];
    
    if (sessionId) {
      removeSession(sessionId);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('💥 Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add this endpoint to validate session from frontend
router.get('/validate', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const sessionId = authHeader && authHeader.split(' ')[1];
    
    if (!sessionId || !validateSession(sessionId)) {
      return res.status(401).json({ 
        valid: false, 
        error: 'Invalid or expired session' 
      });
    }
    
    const session = getSession(sessionId);
    res.json({ 
      valid: true, 
      user: { username: session.username } 
    });
  } catch (error) {
    console.error('💥 Validate error:', error);
    res.status(500).json({
      valid: false,
      error: 'Internal server error'
    });
  }
});

// Only export the router
export default router;