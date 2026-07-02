import React, { useState, useEffect } from 'react';
import { getAccessLogs } from '../../services/api';
import '../../styles/ActivityFeed.css';
const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const logs = await getAccessLogs();
      // Take only the most recent 5 activities
      const recentActivities = logs.slice(0, 5).map(log => ({
        id: log.log_id,
        user: log.user_name || 'Unknown User',
        action: log.action,
        node: log.node_id,
        timestamp: log.timestamp,
        notes: log.notes,
        type: getActivityType(log.action)
      }));
      setActivities(recentActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      // Fallback demo data
      setActivities(getDemoActivities());
    } finally {
      setLoading(false);
    }
  };

  const getActivityType = (action) => {
    switch (action) {
      case 'opened': return 'access';
      case 'closed': return 'access';
      case 'access_denied': return 'denied';
      default: return 'info';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'access': return '🔓';
      case 'denied': return '🚫';
      case 'maintenance': return '🛠️';
      case 'create': return '➕';
      default: return '📝';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return activityTime.toLocaleDateString();
  };

  const getActivityText = (activity) => {
    switch (activity.action) {
      case 'opened':
        return `${activity.user} accessed ${activity.node}`;
      case 'closed':
        return `${activity.user} closed ${activity.node}`;
      case 'access_denied':
        return `${activity.user} denied access to ${activity.node}`;
      default:
        return `${activity.user} ${activity.action} ${activity.node}`;
    }
  };

  if (loading) {
    return (
      <div className="activity-feed-card">
        <div className="card-header">
          <h3>Recent Activity</h3>
        </div>
        <div className="loading-activities">
          <div className="loading-spinner-small"></div>
          <p>Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-feed-card">
      <div className="card-header">
        <h3>Recent Activity</h3>
        <span className="card-subtitle">Latest system events</span>
      </div>
      
      <div className="activities-list">
        {activities.length > 0 ? (
          activities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-content">
                <div className="activity-text">
                  {getActivityText(activity)}
                </div>
                <div className="activity-time">
                  {formatTime(activity.timestamp)}
                </div>
                {activity.notes && (
                  <div className="activity-notes">
                    {activity.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-activities">
            <div className="empty-icon">📝</div>
            <p>No recent activity</p>
          </div>
        )}
      </div>
      
      <div className="card-footer">
        <button 
          className="view-all-btn"
          onClick={loadActivities}
        >
          Refresh Activities
        </button>
      </div>
    </div>
  );
};

// Demo data fallback
const getDemoActivities = () => [
  {
    id: 1,
    user: 'John Doe',
    action: 'opened',
    node: 'DBIN_001',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    notes: 'Successful access',
    type: 'access'
  },
  {
    id: 2,
    user: 'System',
    action: 'maintenance',
    node: 'LKR_005',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    notes: 'Scheduled maintenance',
    type: 'maintenance'
  },
  {
    id: 3,
    user: 'Jane Smith',
    action: 'access_denied',
    node: 'DBIN_003',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    notes: 'No access permissions',
    type: 'denied'
  },
  {
    id: 4,
    user: 'Admin',
    action: 'created',
    node: 'LKR_008',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    notes: 'New node added to system',
    type: 'create'
  }
];

export default ActivityFeed;