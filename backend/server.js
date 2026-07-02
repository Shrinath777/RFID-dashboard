import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import db, { testConnection } from './config/database.js';
import accessRoutes from './routes/access.js';
import nodeRoutes from './routes/nodes.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import { validateSession, getSession } from './config/auth.js'; // ✅ Session-based auth

const app = express();
const server = createServer(app);

// FIXED CORS Configuration
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle pre-flight requests
app.options('*', cors());

app.use(bodyParser.json());

// Apply session authentication middleware to HTTP routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth') || req.path === '/api/health') {
    return next();
  }
  
  // Session-based authentication for HTTP routes
  const authHeader = req.headers['authorization'];
  const sessionId = authHeader && authHeader.split(' ')[1];

  if (!sessionId || !validateSession(sessionId)) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }

  // Attach user to request
  const session = getSession(sessionId);
  req.user = { username: session.username };
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/admin', adminRoutes);

// WebSocket configuration
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// WebSocket authentication middleware (Session-based)
io.use((socket, next) => {
  // Allow controller connections without session auth
  if (socket.handshake.query.controllerKey || socket.handshake.auth.controllerKey) {
    console.log('🔌 Controller connection attempt');
    socket.controllerAuthenticated = true;
    return next();
  }

  // For web clients, use session-based authentication
  const sessionId = socket.handshake.auth.sessionId || 
                   socket.handshake.query.sessionId;

  if (!sessionId) {
    console.log('❌ No session ID provided for WebSocket connection');
    socket.authenticated = false;
    return next();
  }

  // Validate session
  if (validateSession(sessionId)) {
    const session = getSession(sessionId);
    socket.user = { username: session.username };
    socket.authenticated = true;
    console.log('✅ WebSocket authenticated for user:', session.username);
  } else {
    socket.authenticated = false;
    console.log('❌ Invalid WebSocket session');
  }
  
  next();
});

// Store connected dashboard clients
const dashboardClients = new Set();

// Broadcast function for dashboard clients
function broadcastToDashboards(data) {
  dashboardClients.forEach(client => {
    if (client.authenticated) {
      client.emit('nodeStatusUpdate', data);
    }
  });
}

// WebSocket Event Handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id, 
    socket.authenticated ? `User: ${socket.user?.username}` : 
    socket.controllerAuthenticated ? 'Controller' : 'Unauthenticated');

  // Add authenticated dashboard clients to broadcast list
  if (socket.authenticated) {
    dashboardClients.add(socket);
  }

  // Handle controller registration (Arduino/RFID controllers)
  socket.on('controllerRegister', (controllerData) => {
    console.log('🎛️ Controller registered:', controllerData);
    socket.controllerData = controllerData;
    socket.controllerAuthenticated = true;
  });

  // Handle node status updates from controllers
  socket.on('nodeStatusUpdate', async (data) => {
    // Allow only controllers and authenticated users
    if (!socket.controllerAuthenticated && !socket.authenticated) {
      console.log('❌ Unauthorized nodeStatusUpdate attempt');
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    console.log('🔄 Node status update:', data);
    
    try {
      // Update database using the function below
      await updateNodeStatus(data.nodeId, data.status);
      
      console.log(`✅ Node ${data.nodeId} status updated to ${data.status}`);
    } catch (error) {
      console.error('❌ Error updating node status:', error);
      socket.emit('error', { message: 'Failed to update node status' });
    }
  });

  // Handle access events from controllers
  socket.on('accessEvent', async (data) => {
    if (!socket.controllerAuthenticated && !socket.authenticated) {
      console.log('❌ Unauthorized accessEvent attempt');
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    console.log('🔓 Access event:', data);
    
    try {
      await logAccessEventToDB(data);
      console.log(`✅ Access event logged for RFID ${data.rfid}`);
    } catch (error) {
      console.error('❌ Error logging access event:', error);
    }
  });

  // Handle real-time node data requests
  socket.on('getNodeStatus', async (nodeId) => {
    if (!socket.authenticated) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    try {
      const node = await getNodeFromDB(nodeId);
      socket.emit('nodeStatusResponse', {
        nodeId,
        status: node?.status || 'unknown'
      });
    } catch (error) {
      console.error('Error fetching node status:', error);
      socket.emit('error', { message: 'Failed to fetch node status' });
    }
  });

  // Handle session authentication via socket
  socket.on('authenticate', (sessionId) => {
    if (validateSession(sessionId)) {
      const session = getSession(sessionId);
      socket.user = { username: session.username };
      socket.authenticated = true;
      dashboardClients.add(socket);
      socket.emit('authenticated', { user: session.username });
      console.log('✅ Socket authenticated:', session.username);
    } else {
      socket.emit('authentication_failed', { message: 'Invalid session' });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason);
    dashboardClients.delete(socket);
  });

  socket.on('error', (error) => {
    console.error('💥 Socket error:', error);
  });
});

// Make io available to routes
app.set('io', io);

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
  const connectedClients = io.engine.clientsCount;
  res.json({ 
    status: 'OK', 
    message: 'RFID Access Control System is running',
    backend: 'Connected',
    database: 'Connected',
    websocket: {
      connected: true,
      clients: connectedClients
    },
    timestamp: new Date().toISOString()
  });
});

// ✅ ADD THIS FUNCTION - Node status update handler
async function updateNodeStatus(nodeId, status) {
  try {
    const query = 'UPDATE nodes SET status = ? WHERE node_id = ?';
    const [results] = await db.execute(query, [status, nodeId]);
    
    console.log(`🔄 Node ${nodeId} status updated to ${status} by Arduino`);
    
    // Broadcast to all connected dashboard clients
    broadcastToDashboards({
      type: 'nodeStatusUpdate',
      nodeId: nodeId,
      status: status,
      source: 'arduino',
      timestamp: new Date().toISOString()
    });
    
    return results;
  } catch (error) {
    console.error('Database update error:', error);
    throw error;
  }
}

// Database helper functions
async function logAccessEventToDB(data) {
  const [users] = await db.execute(
    'SELECT user_id FROM users WHERE rfid_uid = ?',
    [data.rfid]
  );
  
  if (users.length === 0) {
    throw new Error('User not found');
  }
  
  const userId = users[0].user_id;
  
  const query = `
    INSERT INTO access_logs (user_id, node_id, action, notes, timestamp) 
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const action = data.access_granted ? 'opened' : 'access_denied';
  const notes = JSON.stringify({
    rfid_uid: data.rfid,
    controller_id: data.controllerId,
    reason: data.reason || 'Access requested'
  });
  
  const [result] = await db.execute(query, [
    userId,
    data.node,
    action,
    notes,
    new Date()
  ]);
  return result;
}

async function getNodeFromDB(nodeId) {
  const query = 'SELECT * FROM nodes WHERE node_id = ?';
  const [rows] = await db.execute(query, [nodeId]);
  return rows[0];
}

// Initialize server
const initializeServer = async () => {
  console.log('🔧 Starting RFID Access Control System...\n');
  
  try {
    const dbConnected = await testConnection();
    if (dbConnected) {
      console.log('✅ Database connected successfully\n');
    }
  } catch (error) {
    console.log('⚠️ Database connection failed\n');
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🔗 Frontend: http://localhost:5173`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`\n🔐 Authentication Required:`);
    console.log(`   All API endpoints except /api/auth require session token`);
    console.log(`\n📡 WebSocket Events Available:`);
    console.log(`   - nodeStatusUpdate`);
    console.log(`   - accessEvent`);
    console.log(`   - controllerRegister`);
    console.log(`   - authenticate (for WebSocket auth)`);
  });
};

initializeServer();