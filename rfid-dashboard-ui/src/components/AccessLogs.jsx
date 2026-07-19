import React, { useState, useEffect } from 'react';
import { getAccessLogs } from '../services/api';
import '../styles/AccessLogs.css';
const AccessLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    action: ''
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async (filters = {}) => {
    setLoading(true);
    try {
      const data = await getAccessLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    loadLogs(filter);
  };

  const clearFilter = () => {
    setFilter({ startDate: '', endDate: '', action: '' });
    loadLogs();
  };

  const getStatusClass = (action) => {
    switch (action) {
      case 'opened':
        return 'status-success';
      case 'closed':
        return 'status-info';
      case 'access_denied':
        return 'status-error';
      default:
        return 'status-warning';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'opened':
        return 'lock_open';
      case 'closed':
        return 'lock';
      case 'access_denied':
        return 'block';
      default:
        return 'help';
    }
  };

  // Real-time stats
  const stats = {
    total: logs.length,
    successful: logs.filter(log => log.action === 'opened').length,
    denied: logs.filter(log => log.action === 'access_denied').length
  };

  return (
    <div className="access-logs-section">
      {/* Enhanced Header */}
      <div className="section-header-enhanced">
        <div className="header-main">
          <div className="header-text">
            <div className="section-icon">
              <span className="material-icons">list_alt</span>
            </div>
            <div>
              <h1 className="section-title">Access Logs</h1>
              <p className="section-subtitle">
                Monitor and track all RFID access activities across your nodes
              </p>
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
                <span className="stat-label">Total Logs</span>
              </div>
            </div>
            <div className="stat-pill-medium">
              <div className="stat-icon">
                <span className="material-icons">check_circle</span>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.successful}</span>
                <span className="stat-label">Successful</span>
              </div>
            </div>
            <div className="stat-pill-medium">
              <div className="stat-icon">
                <span className="material-icons">block</span>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.denied}</span>
                <span className="stat-label">Denied</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Controls */}
      <div className="controls-enhanced">
        <div className="controls-left">
          <div className="search-box">
            <span className="search-icon">
              <span className="material-icons">search</span>
            </span>
            <input
              type="text"
              placeholder="Search logs..."
              className="search-input"
            />
          </div>
        </div>
        <div className="controls-right">
          <form onSubmit={handleFilter} className="filter-group-enhanced">
            <div className="filter-item">
              <label className="filter-label">From:</label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                className="filter-select-enhanced"
              />
            </div>
            <div className="filter-item">
              <label className="filter-label">To:</label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({...filter, endDate: e.target.value})}
                className="filter-select-enhanced"
              />
            </div>
            <div className="filter-item">
              <label className="filter-label">Action:</label>
              <select
                value={filter.action}
                onChange={(e) => setFilter({...filter, action: e.target.value})}
                className="filter-select-enhanced"
              >
                <option value="">All Actions</option>
                <option value="opened">Opened</option>
                <option value="closed">Closed</option>
                <option value="access_denied">Access Denied</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">
              Apply Filters
            </button>
            <button type="button" onClick={clearFilter} className="btn-secondary">
              Clear
            </button>
          </form>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="table-container-professional">
        {loading ? (
          <div className="section-loading-enhanced">
            <div className="loading-content">
              <div className="loading-spinner-professional"></div>
              <div className="loading-text">
                <h3>Loading Access Logs</h3>
                <p>Fetching access history data...</p>
              </div>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state-enhanced">
            <div className="empty-icon">
              <span className="material-icons icon-xl">list_alt</span>
            </div>
            <div className="empty-content">
              <h3>No Access Logs Found</h3>
              <p>No access activities recorded for the selected filters.</p>
              <button onClick={clearFilter} className="btn-primary">
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <table className="nodes-table-professional">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Node ID</th>
                <th>Action</th>
                <th>Notes</th>
                <th>Closed Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.log_id} className="log-row">
                  <td className="timestamp">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <div className="user-identity">
                      <strong>{log.user_name}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="node-identity-table">
                      <span className="node-icon">
                        <span className="material-icons">device_hub</span>
                      </span>
                      <span>{log.node_id}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge-table ${getStatusClass(log.action)}`}>
                      <span className="material-icons status-icon">
                        {getActionIcon(log.action)}
                      </span>
                      {log.action.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="log-notes">{log.notes || '-'}</span>
                  </td>
                  <td className="timestamp">
                    {log.closed_timestamp 
                      ? new Date(log.closed_timestamp).toLocaleString()
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Results Summary */}
      {logs.length > 0 && (
        <div className="results-summary">
          <div className="results-badge">
            Showing {logs.length} access logs
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessLogs;