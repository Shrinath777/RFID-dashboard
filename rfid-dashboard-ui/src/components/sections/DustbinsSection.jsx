import React, { useState, useEffect } from 'react';
import { getNodes, updateNode } from '../../services/api';
import '../../styles/DustbinSection.css';  // Changed from "../styles/DustbinsSection.css"
const DustbinsSection = () => {
  const [dustbins, setDustbins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('node_id');

  useEffect(() => {
    loadDustbins();
  }, []);

  const loadDustbins = async () => {
    try {
      const nodes = await getNodes();
      const dustbinNodes = nodes.filter(node => node.type === 'dustbin');
      setDustbins(dustbinNodes);
    } catch (error) {
      console.error('Error loading dustbins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (nodeId, newStatus) => {
    try {
      await updateNode(nodeId, { status: newStatus });
      loadDustbins();
    } catch (error) {
      console.error('Error updating dustbin status:', error);
    }
  };

  // Filter and sort dustbins
  const filteredDustbins = dustbins
    .filter(dustbin => {
      const statusMatch = filter === 'all' || dustbin.status === filter;
      const searchMatch = 
        dustbin.node_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dustbin.location.toLowerCase().includes(searchTerm.toLowerCase());
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
    total: dustbins.length,
    available: dustbins.filter(d => d.status === 'available').length,
    occupied: dustbins.filter(d => d.status === 'occupied').length,
    maintenance: dustbins.filter(d => d.status === 'maintenance').length
  };

  const getStatusConfig = (status) => {
    const configs = {
      available: { 
        color: 'var(--success)', 
        bgColor: 'var(--success-ultralight)',
        statusText: 'Available', 
        description: 'Ready for waste disposal',
        icon: 'delete',
        statusIcon: 'check_circle'
      },
      occupied: { 
        color: 'var(--warning)', 
        bgColor: 'var(--warning-ultralight)',
        statusText: 'In Use', 
        description: 'Currently being used',
        icon: 'delete',
        statusIcon: 'autorenew'
      },
      maintenance: { 
        color: 'var(--error)', 
        bgColor: 'var(--error-ultralight)',
        statusText: 'Maintenance', 
        description: 'Under maintenance',
        icon: 'delete',
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
            <h3>Loading Smart Dustbins</h3>
            <p>Fetching all dustbin nodes data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dustbins-section-enhanced">
      {/* Enhanced Header */}
      <div className="section-header-enhanced">
        <div className="header-main">
          <div className="header-text">
            <div className="section-icon">
              <span className="material-icons">delete</span>
            </div>
            <div>
              <h1 className="section-title">Smart Dustbins</h1>
              <p className="section-subtitle">Monitor and manage all RFID-enabled waste management nodes</p>
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
                <span className="material-icons">check_circle</span>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.available}</span>
                <span className="stat-label">Available</span>
              </div>
            </div>
            <div className="stat-pill-medium">
              <div className="stat-icon">
                <span className="material-icons">autorenew</span>
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
              placeholder="Search dustbins by ID or location..."
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
                <option value="node_id">Dustbin ID</option>
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
            {filteredDustbins.length} dustbins
          </div>
          
          <button className="btn-secondary" onClick={loadDustbins}>
            <span className="material-icons">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Enhanced Dustbins Grid */}
      <div className="nodes-grid-enhanced">
        {filteredDustbins.map(dustbin => {
          const statusConfig = getStatusConfig(dustbin.status);
          const nextStatus = getNextStatus(dustbin.status);
          const nextStatusConfig = getStatusConfig(nextStatus);
          
          return (
            <div key={dustbin.node_id} className={`node-card-enhanced status-${dustbin.status}`}>
              <div className="node-card-header">
                <div className="node-info">
                  <div className="node-type-icon" style={{ backgroundColor: statusConfig.bgColor }}>
                    <span className="material-icons">{statusConfig.icon}</span>
                  </div>
                  <div className="node-identity">
                    <h3>{dustbin.node_id}</h3>
                    <span className="node-type">Smart Dustbin</span>
                  </div>
                </div>
              </div>

              {/* Status Visualization with Emoji */}
              <div className="status-visualization">
                <div className="dustbin-visual">
                  🗑️
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
                  <span>{dustbin.location}</span>
                </div>
              </div>

              <div className="node-info-footer">
                <div className="last-updated">
                  <strong>Last Updated:</strong>{' '}
                  {dustbin.last_updated ? new Date(dustbin.last_updated).toLocaleDateString() : 'Never'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredDustbins.length === 0 && (
        <div className="empty-state-enhanced">
          <div className="empty-icon">🗑️</div>
          <div className="empty-content">
            <h3>No Dustbins Found</h3>
            <p>
              {searchTerm || filter !== 'all' 
                ? 'No dustbins match your current search and filter criteria.'
                : 'No dustbin nodes are currently configured in the system.'
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

export default DustbinsSection;