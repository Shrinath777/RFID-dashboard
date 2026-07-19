import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import AccessLogs from './components/AccessLogs';
import Login from './components/Login';
import socketService from './services/socket';
import { checkHealth, checkAuth, logout } from './services/api';

// Import CSS files from styles directory
import './styles/App.css';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState('checking');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nodeCounts, setNodeCounts] = useState({ dustbins: 0, lockers: 0 });

  // Derive isAuthenticated from user state
  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthentication();
    initializeApp();
    
    return () => {
      // Cleanup socket on unmount
      socketService.disconnect();
    };
  }, []);

  const checkAuthentication = async () => {
    console.log('🏁 Bypass authentication for showcase purposes');
    setUser({ name: 'Guest', role: 'Viewer' });
    setLoading(false);
  };

  const clearAuthData = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const initializeApp = async () => {
    try {
      const health = await checkHealth();
      setSystemStatus('connected');
      
      // Initialize socket connection if authenticated
      if (isAuthenticated) {
        socketService.connect();
      }
      
      // Listen for real-time node count updates
      const socket = socketService.getSocket();
      if (socket) {
        socket.on('nodeCountsUpdate', (counts) => {
          setNodeCounts(counts);
        });
      }
      
    } catch (error) {
      setSystemStatus('disconnected');
      console.error('System health check failed:', error);
    }
  };

  const setupSocketListeners = () => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Real-time updates
    socket.on('nodeStatusUpdate', (data) => {
      console.log('Node status updated:', data);
    });

    socket.on('accessLogUpdate', (log) => {
      console.log('New access log:', log);
    });

    socket.on('connect', () => {
      setSystemStatus('connected');
    });

    socket.on('disconnect', () => {
      setSystemStatus('disconnected');
    });
  };

  const handleLogin = (userData) => {
    console.log('🚀 App: handleLogin called with:', userData);
    
    if (!userData) {
      console.error('❌ handleLogin called with null userData');
      return;
    }

    // Store user data
    setUser(userData);
    
    // Store in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Store tokens if provided
    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
    }
    
    // Connect socket with new token
    if (userData.token) {
      socketService.reconnectWithToken(userData.token);
    } else {
      socketService.connect();
    }
    
    console.log('✅ User data stored, authentication complete');
    console.log('📊 Current user state:', userData);
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      clearAuthData();
      setActiveTab('overview');
      
      // Disconnect socket
      socketService.disconnect();
      
      console.log('✅ Logout completed');
    }
  };

  const renderActiveTab = () => {
    console.log('🔄 Rendering active tab:', activeTab);
    
    switch (activeTab) {
      case 'overview':
        return <Dashboard activeSection="overview" user={user} />;
      case 'dustbins':
        return <Dashboard activeSection="dustbins" user={user} />;
      case 'lockers':
        return <Dashboard activeSection="lockers" user={user} />;
      case 'management':
        return <Dashboard activeSection="management" user={user} />;
      case 'users':
        return <UserManagement user={user} />;
      case 'logs':
        return <AccessLogs user={user} />;
      default:
        return <Dashboard activeSection="overview" user={user} />;
    }
  };

  // Navigation items configuration
  const navigationItems = {
    dashboard: [
      { 
        id: 'overview', 
        label: 'Overview', 
        icon: 'dashboard',
        category: 'Dashboard Views'
      },
      { 
        id: 'dustbins', 
        label: 'Dustbins', 
        icon: 'delete',
        category: 'Dashboard Views',
        badge: nodeCounts.dustbins
      },
      { 
        id: 'lockers', 
        label: 'Lockers', 
        icon: 'lock',
        category: 'Dashboard Views',
        badge: nodeCounts.lockers
      },
      { 
        id: 'management', 
        label: 'All Nodes', 
        icon: 'tune',
        category: 'Dashboard Views'
      }
    ],
    management: [
      { 
        id: 'users', 
        label: 'Users & RFID', 
        icon: 'people',
        category: 'System Management'
      },
      { 
        id: 'logs', 
        label: 'Access Logs', 
        icon: 'list_alt',
        category: 'System Management'
      }
    ]
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <div className="loading-logo">
            <div className="logo-spinner">
              <span className="material-icons">security</span>
            </div>
            <h1>RFID Access Control</h1>
          </div>
          <div className="loading-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <p>Initializing system...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    console.log('🔐 Rendering Login component - user is not authenticated');
    console.log('📊 Current user state:', user);
    return <Login onLogin={handleLogin} />;
  }

  console.log('🏠 Rendering Dashboard - user is authenticated:', user);

  return (
    <div className="app-container">
      {/* Enhanced Header */}
      <header className="app-header-enhanced">
        <div className="header-container">
          <div className="header-left">
            <div className="brand-logo">
              <div className="logo-icon">
                <span className="material-icons">admin_panel_settings</span>
              </div>
              <div className="brand-text">
                <h1 className="brand-title">RFID Access Control</h1>
                <span className="brand-subtitle">Smart Management System</span>
              </div>
            </div>
          </div>

          <div className="header-center">
            <div className={`status-indicator ${systemStatus}`}>
              <span className="status-dot"></span>
              <span className="status-text">
                {systemStatus === 'connected' ? 'System Online' : 
                 systemStatus === 'disconnected' ? 'System Offline' : 'Checking...'}
              </span>
              <span className="material-icons status-icon">
                {systemStatus === 'connected' ? 'wifi' : 
                 systemStatus === 'disconnected' ? 'wifi_off' : 'schedule'}
              </span>
            </div>
          </div>

          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">
                <span className="material-icons">account_circle</span>
              </div>
              <div className="user-info">
                <span className="user-name">{user.name || user.username}</span>
                <span className="user-role">{user.role || 'Administrator'}</span>
              </div>
            </div>
            <button className="logout-btn-enhanced" onClick={handleLogout}>
              <span className="material-icons logout-icon">logout</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Enhanced Professional Navigation */}
      <nav className="app-navigation-enhanced">
        <div className="nav-container-enhanced">
          {/* Dashboard Views Section */}
          <div className="nav-section">
            <div className="nav-section-header">
              <span className="material-icons nav-section-icon">dashboard</span>
              <span className="nav-section-label">Dashboard Views</span>
            </div>
            <div className="nav-buttons-grid">
              {navigationItems.dashboard.map((item) => (
                <button
                  key={item.id}
                  className={`nav-btn-enhanced ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <div className="nav-btn-content">
                    <span className="nav-btn-icon">
                      <span className="material-icons">{item.icon}</span>
                    </span>
                    <span className="nav-btn-label">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="nav-badge-enhanced">{item.badge}</span>
                    )}
                  </div>
                  {activeTab === item.id && (
                    <div className="nav-btn-indicator"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* System Management Section */}
          <div className="nav-section">
            <div className="nav-section-header">
              <span className="material-icons nav-section-icon">settings</span>
              <span className="nav-section-label">System Management</span>
            </div>
            <div className="nav-buttons-grid">
              {navigationItems.management.map((item) => (
                <button
                  key={item.id}
                  className={`nav-btn-enhanced ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <div className="nav-btn-content">
                    <span className="nav-btn-icon">
                      <span className="material-icons">{item.icon}</span>
                    </span>
                    <span className="nav-btn-label">{item.label}</span>
                  </div>
                  {activeTab === item.id && (
                    <div className="nav-btn-indicator"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="app-main-enhanced">
        <div className="main-container">
          {renderActiveTab()}
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="app-footer-enhanced">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-info">
              <span className="material-icons footer-icon">smart_toy</span>
              <p>RFID Smart Access Control System • Real-time Monitoring</p>
            </div>
            <div className="footer-status">
              <span className={`connection-status ${systemStatus}`}>
                <span className="material-icons status-icon">
                  {systemStatus === 'connected' ? 'check_circle' : 'error'}
                </span>
                {systemStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;