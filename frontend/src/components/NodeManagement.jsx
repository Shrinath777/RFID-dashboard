import React, { useState, useEffect } from 'react';
import { getNodes, updateNode, deleteNode } from '../services/api';
import socketService from '../services/socket';
import CreateNodeForm from './CreateNodeForm';
import '../styles/NodeManagement.css';
const NodeManagement = ({ nodes, onNodeUpdated, onNodeDeleted }) => {
  const [editingNode, setEditingNode] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [realTimeNodes, setRealTimeNodes] = useState(nodes);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Initialize with props
  useEffect(() => {
    setRealTimeNodes(nodes);
  }, [nodes]);

  // Calculate enhanced stats
  const stats = {
    total: realTimeNodes.length,
    available: realTimeNodes.filter(node => node.status === 'available').length,
    occupied: realTimeNodes.filter(node => node.status === 'occupied').length,
    maintenance: realTimeNodes.filter(node => node.status === 'maintenance').length,
    dustbins: realTimeNodes.filter(node => node.type === 'dustbin').length,
    lockers: realTimeNodes.filter(node => node.type === 'locker').length
  };

  // WebSocket for real-time status updates from controller
  useEffect(() => {
    const socket = socketService.getSocket();
    
    if (socket) {
      socket.on('nodeStatusUpdate', (data) => {
        console.log('Real-time status update:', data);
        
        setRealTimeNodes(prevNodes => 
          prevNodes.map(node => 
            node.node_id === data.nodeId 
              ? { ...node, status: data.status, last_updated: new Date().toISOString() }
              : node
          )
        );
      });

      socket.on('accessEvent', (data) => {
        console.log('Access event:', data);
      });

      return () => {
        socket.off('nodeStatusUpdate');
        socket.off('accessEvent');
      };
    }
  }, []);

  // Use realTimeNodes instead of nodes for display
  const displayNodes = realTimeNodes;

  const handleEdit = (node) => {
    setEditingNode(node.node_id);
    setEditForm({
      location: node.location,
      status: node.status
    });
  };

  const handleUpdate = async (nodeId) => {
    try {
      await updateNode(nodeId, editForm);
      setEditingNode(null);
      onNodeUpdated();
      
      setRealTimeNodes(prevNodes =>
        prevNodes.map(node =>
          node.node_id === nodeId
            ? { ...node, ...editForm, last_updated: new Date().toISOString() }
            : node
        )
      );
    } catch (error) {
      console.error('Error updating node:', error);
    }
  };

  const handleDelete = async (nodeId) => {
    if (window.confirm('Are you sure you want to delete this node? This action cannot be undone.')) {
      try {
        await deleteNode(nodeId);
        onNodeDeleted();
        setRealTimeNodes(prevNodes => prevNodes.filter(node => node.node_id !== nodeId));
      } catch (error) {
        console.error('Error deleting node:', error);
      }
    }
  };

  // Handle when a new node is created
  const handleNodeCreated = () => {
    setShowCreateForm(false);
    onNodeUpdated();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { class: 'available', label: 'Available', icon: 'check_circle' },
      occupied: { class: 'occupied', label: 'In Use', icon: 'autorenew' },
      maintenance: { class: 'maintenance', label: 'Maintenance', icon: 'build' }
    };
    
    const config = statusConfig[status] || { class: 'default', label: status, icon: 'help' };
    return (
      <span className={`status-badge-table ${config.class}`}>
        <span className="material-icons icon-sm">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      dustbin: { class: 'dustbin', label: 'Dustbin', icon: 'delete' },
      locker: { class: 'locker', label: 'Locker', icon: 'lock' }
    };
    
    const config = typeConfig[type] || { class: 'default', label: type, icon: 'device_hub' };
    return (
      <span className={`node-type-badge ${config.class}`}>
        <span className="material-icons icon-sm">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getNodeIcon = (type) => {
    return type === 'dustbin' ? 'delete' : 'lock';
  };

  // Filter nodes based on type, status, and search term
  const filteredNodes = displayNodes.filter(node => {
    const matchesType = filter === 'all' || node.type === filter;
    const matchesStatus = statusFilter === 'all' || node.status === statusFilter;
    const matchesSearch = node.node_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="node-management-enhanced">
      {/* Single Header Section Only */}
      <div className="section-header-enhanced">
        <div className="header-main">
          <div className="header-text">
            <div className="section-icon">
              <span className="material-icons">device_hub</span>
            </div>
            <div>
              <h1 className="section-title">Node Maagement</h1>
              <p className="section-subtitle">
                Comprehensive management of all RFID access nodes
              </p>
            </div>
          </div>
          <div className="header-actions">
            <div className="header-stats-medium">
              <div className="stat-pill-medium total">
                <div className="stat-icon">
                  <span className="material-icons">device_hub</span>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total Nodes</div>
                </div>
              </div>
              <div className="stat-pill-medium available">
                <div className="stat-icon">
                  <span className="material-icons">check_circle</span>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.available}</div>
                  <div className="stat-label">Available</div>
                </div>
              </div>
              <div className="stat-pill-medium occupied">
                <div className="stat-icon">
                  <span className="material-icons">autorenew</span>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.occupied}</div>
                  <div className="stat-label">In Use</div>
                </div>
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
              placeholder="Search nodes by ID or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group-enhanced">
            <div className="filter-item">
              <label className="filter-label">Type:</label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select-enhanced"
              >
                <option value="all">All Types</option>
                <option value="dustbin">Dustbins</option>
                <option value="locker">Lockers</option>
              </select>
            </div>
            
            <div className="filter-item">
              <label className="filter-label">Status:</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select-enhanced"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">In Use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        <div className="controls-right">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <span className="material-icons view-icon">table_chart</span>
              Table
            </button>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <span className="material-icons view-icon">grid_view</span>
              Grid
            </button>
          </div>
          
          <button 
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            <span className="material-icons">add_circle</span>
            Create Node
          </button>
          
          <div className="results-badge">
            {filteredNodes.length} nodes
          </div>
        </div>
      </div>

      {/* Create Node Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay-enhanced">
          <div className="modal-content-enhanced large-modal">
            <div className="modal-header-enhanced">
              <div className="modal-title">
                <span className="modal-icon">
                  <span className="material-icons">add_circle</span>
                </span>
                <h2>Create New RFID Node</h2>
              </div>
              <button 
                className="modal-close-enhanced"
                onClick={() => setShowCreateForm(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <CreateNodeForm 
                onNodeCreated={handleNodeCreated}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="table-container-professional">
          <table className="nodes-table-professional">
            <thead>
              <tr>
                <th>Node Details</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Last Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map(node => (
                <tr key={node.node_id} className="node-row">
                  <td>
                    <div className="node-identity-table">
                      <div className="node-icon">
                        <span className="material-icons">{getNodeIcon(node.type)}</span>
                      </div>
                      <div className="node-details">
                        <strong className="node-id">{node.node_id}</strong>
                        <span className="node-meta">ID: {node.node_id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {getTypeBadge(node.type)}
                  </td>
                  <td>
                    {editingNode === node.node_id ? (
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                        className="edit-input-table"
                        placeholder="Enter location..."
                      />
                    ) : (
                      <span className="node-location">{node.location}</span>
                    )}
                  </td>
                  <td>
                    {editingNode === node.node_id ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className="edit-select-table"
                      >
                        <option value="available">Available</option>
                        <option value="occupied">In Use</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    ) : (
                      getStatusBadge(node.status)
                    )}
                  </td>
                  <td>
                    <span className="timestamp">
                      {node.last_updated 
                        ? new Date(node.last_updated).toLocaleTimeString()
                        : 'Never'
                      }
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {editingNode === node.node_id ? (
                        <>
                          <button 
                            className="btn-success-small"
                            onClick={() => handleUpdate(node.node_id)}
                            title="Save changes"
                          >
                            <span className="material-icons icon-sm">save</span>
                            Save
                          </button>
                          <button 
                            className="btn-secondary-small"
                            onClick={() => setEditingNode(null)}
                            title="Cancel editing"
                          >
                            <span className="material-icons icon-sm">close</span>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="btn-primary-small"
                            onClick={() => handleEdit(node)}
                            title="Edit node"
                          >
                            <span className="material-icons icon-sm">edit</span>
                            Edit
                          </button>
                          <button 
                            className="btn-danger-small"
                            onClick={() => handleDelete(node.node_id)}
                            title="Delete node"
                          >
                            <span className="material-icons icon-sm">delete</span>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredNodes.length === 0 && (
            <div className="empty-state-enhanced">
              <div className="empty-icon">
                <span className="material-icons icon-xl">table_chart</span>
              </div>
              <div className="empty-content">
                <h3>No Nodes Found</h3>
                <p>No nodes match your current filter criteria. Try adjusting your filters or search term.</p>
                {(filter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                  <button 
                    onClick={() => {
                      setFilter('all');
                      setStatusFilter('all');
                      setSearchTerm('');
                    }}
                    className="btn-primary"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="nodes-grid-enhanced">
          {filteredNodes.map(node => (
            <div key={node.node_id} className={`node-card-enhanced status-${node.status}`}>
              <div className="node-card-header">
                <div className="node-info">
                  <div className="node-type-icon">
                    <span className="material-icons">{getNodeIcon(node.type)}</span>
                  </div>
                  <div className="node-identity">
                    <h3>{node.node_id}</h3>
                    <span className="node-type">{node.type}</span>
                  </div>
                </div>
                {getTypeBadge(node.type)}
              </div>

              <div className="status-visualization">
                <div className="status-indicator-visual">
                  <span className="status-icon-visual">
                    <span className="material-icons">
                      {node.status === 'available' ? 'check_circle' : 
                       node.status === 'occupied' ? 'autorenew' : 'build'}
                    </span>
                  </span>
                  {node.status === 'available' ? 'Available' : 
                   node.status === 'occupied' ? 'In Use' : 'Maintenance'}
                </div>
              </div>

              <div className="status-description">
                <p>
                  {node.status === 'available' ? 'Ready for use' : 
                   node.status === 'occupied' ? 'Currently in use' : 
                   'Under maintenance'}
                </p>
              </div>

              <div className="node-location">
                <div className="location-icon">
                  <span className="material-icons">location_on</span>
                </div>
                <div className="location-text">
                  <strong>Location</strong>
                  {editingNode === node.node_id ? (
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="edit-input-professional"
                      placeholder="Enter location..."
                    />
                  ) : (
                    <span>{node.location}</span>
                  )}
                </div>
              </div>

              <div className="node-capacity">
                <div className="capacity-indicator">
                  <span className="capacity-label">Status:</span>
                  <div className="capacity-bar">
                    <div 
                      className="capacity-fill"
                      style={{
                        width: node.status === 'available' ? '100%' : 
                               node.status === 'occupied' ? '60%' : '30%'
                      }}
                    ></div>
                  </div>
                  <span className="capacity-text">
                    {node.status === 'available' ? 'Ready' : 
                     node.status === 'occupied' ? 'In Use' : 'Maint'}
                  </span>
                </div>
              </div>

              <div className="node-info-footer">
                <div className="last-updated">
                  Last updated: {node.last_updated 
                    ? new Date(node.last_updated).toLocaleString()
                    : 'Never'
                  }
                </div>
              </div>

              <div className="node-actions-footer">
                {editingNode === node.node_id ? (
                  <div className="edit-actions">
                    <button 
                      className="status-btn active"
                      onClick={() => handleUpdate(node.node_id)}
                    >
                      <span className="material-icons icon-sm">save</span>
                      Save
                    </button>
                    <button 
                      className="status-btn"
                      onClick={() => setEditingNode(null)}
                    >
                      <span className="material-icons icon-sm">close</span>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="quick-actions">
                    <button 
                      className="status-btn"
                      onClick={() => handleEdit(node)}
                    >
                      <span className="material-icons icon-sm">edit</span>
                      Edit
                    </button>
                    <button 
                      className="status-btn"
                      onClick={() => handleDelete(node.node_id)}
                    >
                      <span className="material-icons icon-sm">delete</span>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredNodes.length === 0 && (
            <div className="empty-state-enhanced">
              <div className="empty-icon">
                <span className="material-icons icon-xl">grid_view</span>
              </div>
              <div className="empty-content">
                <h3>No Nodes Found</h3>
                <p>No nodes match your current filter criteria. Try adjusting your filters or search term.</p>
                {(filter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                  <button 
                    onClick={() => {
                      setFilter('all');
                      setStatusFilter('all');
                      setSearchTerm('');
                    }}
                    className="btn-primary"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NodeManagement;