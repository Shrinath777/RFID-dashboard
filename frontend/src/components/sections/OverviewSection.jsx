import React, { useState, useEffect } from 'react';
import { getNodes, getUsers, getAccessLogs, createNode } from '../../services/api';
import '../../styles/OverviewSection.css';
// StatsCard Component
const StatsCard = ({ title, value, icon, color, trend, description }) => {
  return (
    <div className="stats-card-enhanced" style={{ '--card-color': color }}>
      <div className="stats-card-header">
        <div className="stats-icon-container" style={{ backgroundColor: color + '20' }}>
          <span className="material-icons" style={{ color: color }}>{icon}</span>
        </div>
        <div className="stats-trend">{trend}</div>
      </div>
      <div className="stats-content">
        <h3>{value}</h3>
        <div className="stats-title">{title}</div>
        <div className="stats-description">{description}</div>
      </div>
      <div className="stats-card-decoration"></div>
    </div>
  );
};

// QuickActions Component
const QuickActions = ({ onActionClick }) => {
  const actions = [
    { 
      icon: 'add', 
      label: 'Add Node', 
      description: 'Create new RFID node',
      action: 'add_node'
    },
    { 
      icon: 'person_add', 
      label: 'Add User', 
      description: 'Create new system user',
      action: 'add_user'
    },
    { 
      icon: 'assessment', 
      label: 'View Reports', 
      description: 'Generate system reports',
      action: 'view_reports'
    },
    { 
      icon: 'list_alt', 
      label: 'Access Logs', 
      description: 'View access history',
      action: 'access_logs'
    }
  ];

  return (
    <div className="quick-actions-card">
      <h3>
        <span className="material-icons icon-md" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>flash_on</span>
        Quick Actions
      </h3>
      <div className="actions-grid">
        {actions.map((action, index) => (
          <button 
            key={index} 
            className="action-btn"
            onClick={() => onActionClick(action.action)}
          >
            <span className="material-icons action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
            <small>{action.description}</small>
          </button>
        ))}
      </div>
    </div>
  );
};

// ActivityFeed Component with Real Data
const ActivityFeed = ({ activities, onViewAllLogs }) => {
  const getActivityIcon = (action) => {
    switch (action) {
      case 'opened': return 'lock_open';
      case 'closed': return 'lock';
      case 'access_denied': return 'block';
      case 'user_registered': return 'person_add';
      case 'node_created': return 'add';
      case 'node_updated': return 'edit';
      case 'maintenance': return 'build';
      default: return 'notifications';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="activity-feed-card">
      <h3>
        <span className="material-icons icon-md" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>notifications</span>
        Recent Activity
      </h3>
      <div className="activities-list">
        {activities.length > 0 ? (
          activities.slice(0, 6).map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">
                <span className="material-icons">{getActivityIcon(activity.action)}</span>
              </div>
              <div className="activity-content">
                <div className="activity-text">{activity.message}</div>
                <div className="activity-time">{formatTime(activity.timestamp)}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-activities">
            <span className="material-icons" style={{ fontSize: '2rem', opacity: 0.5 }}>notifications_off</span>
            <p>No recent activity</p>
          </div>
        )}
      </div>
      {activities.length > 0 && (
        <div className="card-footer">
          <button className="view-all-btn" onClick={onViewAllLogs}>
            View All Activity
          </button>
        </div>
      )}
    </div>
  );
};

const OverviewSection = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    total_nodes: 0,
    available_nodes: 0,
    occupied_nodes: 0,
    maintenance_nodes: 0,
    total_users: 0,
    today_accesses: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateNodeModal, setShowCreateNodeModal] = useState(false);

  useEffect(() => {
    loadData();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [nodesData, usersData, logsData] = await Promise.all([
        getNodes(),
        getUsers(),
        getAccessLogs()
      ]);
      
      // Calculate real-time stats from actual data
      const totalNodes = nodesData.length;
      const availableNodes = nodesData.filter(node => node.status === 'available').length;
      const occupiedNodes = nodesData.filter(node => node.status === 'occupied').length;
      const maintenanceNodes = nodesData.filter(node => node.status === 'maintenance').length;
      const totalUsers = usersData.length;
      
      // Calculate today's accesses
      const today = new Date().toDateString();
      const todayAccesses = logsData.filter(log => 
        new Date(log.timestamp).toDateString() === today
      ).length;

      // Generate real activity feed from access logs and system events
      const recentActivities = [
        // Access events from logs
        ...logsData.slice(0, 8).map(log => ({
          action: log.action,
          message: `${log.user_name} ${log.action === 'access_denied' ? 'was denied access to' : 'accessed'} ${log.node_id}`,
          timestamp: log.timestamp
        })),
        // User registration events
        ...usersData.slice(-2).map(user => ({
          action: 'user_registered',
          message: `New user ${user.name} registered`,
          timestamp: user.created_at || new Date().toISOString()
        })),
        // Node status changes
        ...nodesData.filter(node => node.last_updated).slice(-2).map(node => ({
          action: 'node_updated',
          message: `${node.node_id} status changed to ${node.status}`,
          timestamp: node.last_updated
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6);

      setStats({
        total_nodes: totalNodes,
        available_nodes: availableNodes,
        occupied_nodes: occupiedNodes,
        maintenance_nodes: maintenanceNodes,
        total_users: totalUsers,
        today_accesses: todayAccesses
      });

      setActivities(recentActivities);
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'add_node':
        setShowCreateNodeModal(true);
        break;
      case 'add_user':
        // Navigate to users tab with create mode
        if (onNavigate) onNavigate('users');
        break;
      case 'view_reports':
        // You can implement a reports tab or show a modal
        console.log('View reports action');
        alert('Reports feature coming soon!');
        break;
      case 'access_logs':
        // Navigate to access logs tab
        if (onNavigate) onNavigate('logs');
        break;
      default:
        console.log('Action not implemented:', action);
    }
  };

  const handleViewAllLogs = () => {
    // Navigate to access logs tab
    if (onNavigate) onNavigate('logs');
  };

  const handleCreateNode = async (nodeData) => {
    try {
      await createNode(nodeData);
      setShowCreateNodeModal(false);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error creating node:', error);
    }
  };

  const handleGenerateReport = () => {
    // Generate a simple report download
    const reportData = {
      generatedAt: new Date().toISOString(),
      stats: stats,
      totalActivities: activities.length
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="section-loading-enhanced">
        <div className="loading-content">
          <div className="loading-spinner-professional"></div>
          <div className="loading-text">
            <h3>Loading Dashboard</h3>
            <p>Fetching real-time system data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-section">
      {/* Welcome Header */}
      <div className="section-header-main">
        <div className="welcome-content">
          <h1 className="welcome-title">Dashboard Overview</h1>
          <p className="welcome-subtitle">Real-time monitoring of RFID access control system</p>
          <div className="last-updated" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div className="welcome-actions">
          <button className="btn-primary-action" onClick={loadData}>
            <span className="material-icons btn-icon">refresh</span>
            Refresh
          </button>
          <button className="btn-primary-action" onClick={handleGenerateReport} style={{ marginLeft: '0.5rem' }}>
            <span className="material-icons btn-icon">assessment</span>
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid-enhanced">
        <StatsCard
          title="Total Nodes"
          value={stats.total_nodes}
          icon="device_hub"
          color="var(--primary)"
          trend={`${stats.total_nodes > 0 ? '+' : ''}${stats.total_nodes} total`}
          description="RFID nodes in system"
        />
        <StatsCard
          title="Available"
          value={stats.available_nodes}
          icon="check_circle"
          color="var(--success)"
          trend={`${Math.round((stats.available_nodes / stats.total_nodes) * 100) || 0}% available`}
          description="Nodes ready for use"
        />
        <StatsCard
          title="In Use"
          value={stats.occupied_nodes}
          icon="autorenew"
          color="var(--warning)"
          trend={`${Math.round((stats.occupied_nodes / stats.total_nodes) * 100) || 0}% in use`}
          description="Currently occupied"
        />
        <StatsCard
          title="Maintenance"
          value={stats.maintenance_nodes}
          icon="build"
          color="var(--error)"
          trend={`${Math.round((stats.maintenance_nodes / stats.total_nodes) * 100) || 0}% maintenance`}
          description="Under maintenance"
        />
        <StatsCard
          title="Total Users"
          value={stats.total_users}
          icon="people"
          color="var(--info)"
          trend={`${stats.total_users} registered`}
          description="System users"
        />
        <StatsCard
          title="Today's Activity"
          value={stats.today_accesses}
          icon="trending_up"
          color="var(--secondary)"
          trend={`${stats.today_accesses} accesses`}
          description="Access requests today"
        />
      </div>

      {/* Content Grid */}
      <div className="overview-content-grid">
        <div className="content-column">
          <QuickActions onActionClick={handleQuickAction} />
        </div>
        <div className="content-column">
          <ActivityFeed 
            activities={activities} 
            onViewAllLogs={handleViewAllLogs}
          />
        </div>
      </div>

      {/* Create Node Modal */}
      {showCreateNodeModal && (
        <CreateNodeModal 
          onClose={() => setShowCreateNodeModal(false)}
          onSubmit={handleCreateNode}
        />
      )}
    </div>
  );
};

// Simple Create Node Modal Component
const CreateNodeModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    node_id: '',
    location: '',
    type: 'dustbin',
    status: 'available'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay-enhanced">
      <div className="modal-content-enhanced">
        <div className="modal-header-enhanced">
          <div className="modal-title">
            <span className="modal-icon">
              <span className="material-icons">add_circle</span>
            </span>
            <h2>Create New Node</h2>
          </div>
          <button className="modal-close-enhanced" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="form-grid-modal">
            <div className="form-group-enhanced">
              <label className="form-label-enhanced">Node ID *</label>
              <input
                type="text"
                value={formData.node_id}
                onChange={(e) => setFormData({...formData, node_id: e.target.value})}
                className="form-input-enhanced"
                placeholder="e.g., DBIN_001, LKR_001"
                required
              />
            </div>
            <div className="form-group-enhanced">
              <label className="form-label-enhanced">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="form-input-enhanced"
                placeholder="e.g., Floor 1 - Entrance"
                required
              />
            </div>
            <div className="form-group-enhanced">
              <label className="form-label-enhanced">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="form-select-enhanced"
                required
              >
                <option value="dustbin">Dustbin</option>
                <option value="locker">Locker</option>
              </select>
            </div>
            <div className="form-group-enhanced">
              <label className="form-label-enhanced">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="form-select-enhanced"
                required
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Node
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;