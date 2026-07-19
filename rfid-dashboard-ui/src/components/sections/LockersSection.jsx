import React, { useState, useEffect } from 'react';
import { getNodes, updateNode } from '../../services/api';
import '../../styles/LockerSection.css';
const LockersSection = () => {
  const [lockers, setLockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('node_id');
  const [selectedLocker, setSelectedLocker] = useState(null);

  useEffect(() => {
    loadLockers();
  }, []);

  const loadLockers = async () => {
    try {
      const nodes = await getNodes();
      const lockerNodes = nodes.filter(node => node.type === 'locker');
      setLockers(lockerNodes);
    } catch (error) {
      console.error('Error loading lockers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (nodeId, newStatus) => {
    try {
      await updateNode(nodeId, { status: newStatus });
      loadLockers();
      setSelectedLocker(null);
    } catch (error) {
      console.error('Error updating locker status:', error);
    }
  };

  // Filter and sort lockers
  const filteredLockers = lockers
    .filter(locker => {
      const statusMatch = filter === 'all' || locker.status === filter;
      const searchMatch = 
        locker.node_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        locker.location.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && searchMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'location':
          return a.location.localeCompare(b.location);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'node_id':
        default:
          return a.node_id.localeCompare(b.node_id);
      }
    });

  const stats = {
    total: lockers.length,
    available: lockers.filter(l => l.status === 'available').length,
    occupied: lockers.filter(l => l.status === 'occupied').length,
    maintenance: lockers.filter(l => l.status === 'maintenance').length
  };

  const getStatusConfig = (status) => {
    const configs = {
      available: { 
        color: 'var(--success)', 
        bgColor: 'var(--success-ultralight)',
        statusText: 'Available', 
        description: 'Ready for secure storage - Empty and accessible',
        emoji: '👝',
        statusIcon: 'check_circle'
      },
      occupied: { 
        color: 'var(--warning)', 
        bgColor: 'var(--warning-ultralight)',
        statusText: 'In Use', 
        description: 'Currently occupied and locked - Secure storage active',
        emoji: '👝',
        statusIcon: 'lock'
      },
      maintenance: { 
        color: 'var(--error)', 
        bgColor: 'var(--error-ultralight)',
        statusText: 'Maintenance', 
        description: 'Under maintenance - Access restricted',
        emoji: '🛠️',
        statusIcon: 'build'
      }
    };
    return configs[status] || configs.available;
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      available: 'occupied',
      occupied: 'available',
      maintenance: 'available'
    };
    return statusFlow[currentStatus] || 'available';
  };

  if (loading) {
    return (
      <div className="section-loading-enhanced">
        <div className="loading-content">
          <div className="loading-spinner-professional"></div>
          <div className="loading-text">
            <h3>Loading Smart Lockers</h3>
            <p>Fetching all secure locker nodes data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lockers-section-enhanced">
      {/* Enhanced Header */}
      <div className="section-header-enhanced">
        <div className="header-main">
          <div className="header-text">
            <div className="section-icon">
              <span className="material-icons">lock</span>
            </div>
            <div>
              <h1 className="section-title">Smart Lockers</h1>
              <p className="section-subtitle">Monitor and manage all RFID-enabled secure storage nodes</p>
            </div>
          </div>
          {/* Medium Size Stats */}
          <div className="header-stats-medium">
            <div className="stat-pill-medium">
              <div className="stat-icon">
                <span className="material-icons">analytics</span>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>
            <div className="stat-pill-medium">
              <div className="stat-icon">
                <span className="material-icons">lock_open</span>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.available}</span>
                <span className="stat-label">Available</span>
              </div>
            </div>
            <div className="stat-pill-medium">
              <div className="stat-icon">
                <span className="material-icons">lock</span>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.occupied}</span>
                <span className="stat-label">In Use</span>
              </div>
            </div>
            <div className="stat-pill-medium">
              <div className="stat-icon">
                <span className="material-icons">build</span>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.maintenance}</span>
                <span className="stat-label">Maintenance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="controls-enhanced">
        <div className="controls-left">
          <div className="search-box">
            <span className="search-icon">
              <span className="material-icons">search</span>
            </span>
            <input
              type="text"
              placeholder="Search lockers by ID or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group-enhanced">
            <div className="filter-item">
              <label className="filter-label">Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select-enhanced"
              >
                <option value="node_id">Locker ID</option>
                <option value="location">Location</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        <div className="controls-right">
          <div className="filter-group-enhanced">
            <div className="filter-item">
              <label className="filter-label">Status:</label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select-enhanced"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">In Use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          
          <div className="results-badge">
            {filteredLockers.length} lockers
          </div>
          
          <button className="btn-secondary" onClick={loadLockers}>
            <span className="material-icons">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Enhanced Lockers Grid */}
      <div className="nodes-grid-enhanced">
        {filteredLockers.map(locker => {
          const statusConfig = getStatusConfig(locker.status);
          const nextStatus = getNextStatus(locker.status);
          const nextStatusConfig = getStatusConfig(nextStatus);
          
          return (
            <div key={locker.node_id} className={`node-card-enhanced status-${locker.status} ${selectedLocker?.node_id === locker.node_id ? 'selected' : ''}`}>
              <div className="node-card-header">
                <div className="node-info">
                  <div className="node-type-icon" style={{ backgroundColor: statusConfig.bgColor }}>
                    <span className="material-icons">lock</span>
                  </div>
                  <div className="node-identity">
                    <h3>{locker.node_id}</h3>
                    <span className="node-type">Secure Locker</span>
                  </div>
                </div>
              </div>

              {/* Status Visualization with Emoji */}
              <div className="status-visualization">
                <div className="locker-visual">
                  {statusConfig.emoji}
                </div>
              </div>

              <div className="status-indicator-visual">
                <span className="status-icon-visual">
                  <span className="material-icons">{statusConfig.statusIcon}</span>
                </span>
                {statusConfig.statusText}
              </div>

              <div className="status-description">
                <p>{statusConfig.description}</p>
              </div>

              <div className="node-location">
                <div className="location-icon">
                  <span className="material-icons">location_on</span>
                </div>
                <div className="location-text">
                  <strong>Location:</strong>
                  <span>{locker.location}</span>
                </div>
              </div>

              <div className="node-capacity">
                <div className="capacity-indicator">
                  <span className="capacity-label">Storage Status:</span>
                  <div className="capacity-bar">
                    <div 
                      className={`capacity-fill ${locker.status}`}
                      style={{ 
                        width: locker.status === 'occupied' ? '100%' : '0%',
                        backgroundColor: statusConfig.color
                      }}
                    ></div>
                  </div>
                  <span className="capacity-text">
                    {locker.status === 'occupied' ? 'Full' : 'Empty'}
                  </span>
                </div>
              </div>

              <div className="node-info-footer">
                <div className="last-updated">
                  <strong>Last Activity:</strong>{' '}
                  {locker.last_updated ? new Date(locker.last_updated).toLocaleDateString() : 'No activity'}
                </div>
              </div>

              {/* Quick Details Panel */}
              {selectedLocker?.node_id === locker.node_id && (
                <div className="quick-details-panel">
                  <div className="details-content">
                    <h4>Locker Details</h4>
                    <div className="detail-item">
                      <span>Locker ID:</span>
                      <strong>{locker.node_id}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Current Status:</span>
                      <strong style={{ color: statusConfig.color }}>{statusConfig.statusText}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Location:</span>
                      <span>{locker.location}</span>
                    </div>
                    <div className="detail-item">
                      <span>Last Updated:</span>
                      <span>{locker.last_updated ? new Date(locker.last_updated).toLocaleString() : 'Never'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredLockers.length === 0 && (
        <div className="empty-state-enhanced">
          <div className="empty-icon">👝</div>
          <div className="empty-content">
            <h3>No Lockers Found</h3>
            <p>
              {searchTerm || filter !== 'all' 
                ? 'No lockers match your current search and filter criteria.'
                : 'No locker nodes are currently configured in the system.'
              }
            </p>
            {(searchTerm || filter !== 'all') && (
              <button 
                className="btn-primary"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LockersSection;