// In-memory session storage (for development)
const sessions = new Map();

// Default admin credentials (change these for production)
const ADMIN_CREDENTIALS = {
  username: 'Shrinath',
  password: 'Tonystark_7777'
};

// Validate admin credentials
export const authenticateAdmin = (username, password) => {
  return username === ADMIN_CREDENTIALS.username && 
         password === ADMIN_CREDENTIALS.password;
};

// Create a new session
export const createSession = (username) => {
  const sessionId = generateSessionId();
  const session = {
    id: sessionId,
    username: username,
    createdAt: new Date(),
    lastAccessed: new Date()
  };
  
  sessions.set(sessionId, session);
  console.log('🔐 Session created for:', username);
  return sessionId;
};

// Remove session (logout)
export const removeSession = (sessionId) => {
  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
    console.log('🔐 Session removed:', sessionId);
  }
};

// Validate session
export const validateSession = (sessionId) => {
  if (!sessions.has(sessionId)) {
    return false;
  }
  
  const session = sessions.get(sessionId);
  
  // Check if session is expired (24 hours)
  const now = new Date();
  const sessionAge = now - session.createdAt;
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  if (sessionAge > maxAge) {
    sessions.delete(sessionId);
    console.log('🔐 Session expired:', sessionId);
    return false;
  }
  
  // Update last accessed time
  session.lastAccessed = now;
  sessions.set(sessionId, session);
  
  return true;
};

// Get session data
export const getSession = (sessionId) => {
  return sessions.get(sessionId);
};

// Clean up expired sessions (optional: run periodically)
export const cleanupExpiredSessions = () => {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000;
  
  for (const [sessionId, session] of sessions.entries()) {
    const sessionAge = now - session.createdAt;
    if (sessionAge > maxAge) {
      sessions.delete(sessionId);
      console.log('🧹 Cleaned expired session:', sessionId);
    }
  }
};

// Generate random session ID
function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Run cleanup every hour (optional)
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

// Remove the default export if using named exports everywhere
// export default {
//   authenticateAdmin,
//   createSession,
//   removeSession,
//   validateSession,
//   getSession
// };