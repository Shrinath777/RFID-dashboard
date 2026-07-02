import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-server.com' 
  : 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
  }

  connect() {
    const token = localStorage.getItem('authToken');
    
    console.log('🔌 Connecting to WebSocket with token:', !!token);
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      this.isConnected = true;
      
      // Authenticate socket if we have a token
      const token = localStorage.getItem('authToken');
      if (token) {
        this.authenticate(token);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket:', reason);
      this.isConnected = false;
      this.isAuthenticated = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('💥 WebSocket connection error:', error);
      this.isConnected = false;
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('✅ WebSocket authenticated:', data.user);
      this.isAuthenticated = true;
    });

    this.socket.on('authentication_failed', (data) => {
      console.log('❌ WebSocket authentication failed:', data.message);
      this.isAuthenticated = false;
    });

    // Application events
    this.socket.on('nodeStatusUpdate', (data) => {
      console.log('🔄 Real-time node update:', data);
    });

    this.socket.on('accessEvent', (data) => {
      console.log('🔓 Real-time access event:', data);
    });
  }

  authenticate(token) {
    if (this.socket && this.isConnected) {
      console.log('🔐 Authenticating WebSocket...');
      this.socket.emit('authenticate', token);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isAuthenticated = false;
    }
  }

  // Reconnect with new token (after login)
  reconnectWithToken(token) {
    this.disconnect();
    localStorage.setItem('authToken', token);
    return this.connect();
  }

  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;