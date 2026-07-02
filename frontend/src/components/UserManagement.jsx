import React, { useState, useEffect } from 'react';
import { getUsers, createUser, getNodes, assignNodeToUser, removeNodeFromUser } from '../services/api';
import '../styles/UserManagement.css';
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rfid_uid: ''
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
    loadNodes();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNodes = async () => {
    try {
      const data = await getNodes();
      setNodes(data);
    } catch (error) {
      console.error('Error loading nodes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    setError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.rfid_uid.trim()) {
      setError('All fields are required');
      setCreatingUser(false);
      return;
    }

    try {
      await createUser(formData);
      setFormData({ name: '', email: '', rfid_uid: '' });
      setShowCreateForm(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleAssignNode = async (userId, nodeId) => {
    if (!nodeId) return;
    
    try {
      await assignNodeToUser(userId, nodeId);
      loadUsers();
    } catch (error) {
      alert('Error assigning node: ' + error.message);
    }
  };

  const handleRemoveNode = async (userId, nodeId) => {
    if (!window.confirm('Are you sure you want to remove this node assignment?')) return;
    
    try {
      await removeNodeFromUser(userId, nodeId);
      loadUsers();
    } catch (error) {
      alert('Error removing node assignment: ' + error.message);
    }
  };

  const getAvailableNodes = (user) => {
    return nodes.filter(node => 
      !user.assigned_nodes?.includes(node.node_id)
    );
  };

  // Real-time stats
  const stats = {
    total: users.length,
    active: users.filter(user => user.assigned_nodes?.length > 0).length,
    assignments: users.reduce((acc, user) => acc + (user.assigned_nodes?.length || 0), 0)
  };

  return (
    <div className="user-management-section">
      {/* Enhanced Header */}
      {/* Enhanced Header */}
<div className="section-header-enhanced">
  <div className="header-main">
    <div className="header-left-content">
      <div className="header-text">
          <div 
    className="section-icon" 
    style={{ 
      width: '48px', 
      height: '48px', 
      fontSize: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--primary-ultralight)',
      borderRadius: 'var(--radius-lg)',
      flexShrink: 0
    }}
  >
          <span className="material-icons">people</span>
        </div>
        <div>
          <h1 className="section-title">User Management</h1>
          <p className="section-subtitle">
            Manage system users and their RFID access permissions
          </p>
        </div>
      </div>
      
      {/* Create User Button below the title */}
      <div className="header-create-action">
        <button 
          className="btn-create-user-large"
          onClick={() => setShowCreateForm(true)}
        >
          <span className="material-icons btn-icon">person_add</span>
          Create New User
        </button>
      </div>
    </div>
    
    {/* Stats on the right side */}
    <div className="header-stats-medium">
      <div className="stat-pill-medium">
        <div className="stat-icon">
          <span className="material-icons">person</span>
        </div>
        <div className="stat-content">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Users</span>
        </div>
      </div>
      <div className="stat-pill-medium">
        <div className="stat-icon">
          <span className="material-icons">link</span>
        </div>
        <div className="stat-content">
          <span className="stat-value">{stats.active}</span>
          <span className="stat-label">Active Users</span>
        </div>
      </div>
      <div className="stat-pill-medium">
        <div className="stat-icon">
          <span className="material-icons">flash_on</span>
        </div>
        <div className="stat-content">
          <span className="stat-value">{stats.assignments}</span>
          <span className="stat-label">Assignments</span>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="modal-overlay-enhanced">
          <div className="modal-content-enhanced">
            <div className="modal-header-enhanced">
              <div className="modal-title">
                <span className="modal-icon">
                  <span className="material-icons">person_add</span>
                </span>
                <h2>Create New User</h2>
              </div>
              <button 
                className="modal-close-enhanced"
                onClick={() => setShowCreateForm(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="create-user-form">
                <div className="form-content">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter user's full name"
                      disabled={creatingUser}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter user's email address"
                      disabled={creatingUser}
                    />
                  </div>

                  <div className="form-group">
                    <label>RFID UID *</label>
                    <input
                      type="text"
                      name="rfid_uid"
                      value={formData.rfid_uid}
                      onChange={handleChange}
                      placeholder="Enter RFID unique identifier"
                      disabled={creatingUser}
                    />
                  </div>

                  {error && (
                    <div className="error-message">
                      <span className="material-icons">error</span>
                      {error}
                    </div>
                  )}

                  <div className="form-actions">
                    <button 
                      type="button" 
                      onClick={() => setShowCreateForm(false)} 
                      disabled={creatingUser}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={creatingUser} 
                      className="primary"
                    >
                      {creatingUser ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Users Table */}
      <div className="management-content">
        {loading ? (
          <div className="section-loading-enhanced">
            <div className="loading-content">
              <div className="loading-spinner-professional"></div>
              <div className="loading-text">
                <h3>Loading Users</h3>
                <p>Fetching user data and permissions...</p>
              </div>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state-enhanced">
            <div className="empty-icon">
              <span className="material-icons icon-xl">people</span>
            </div>
            <div className="empty-content">
              <h3>No Users Found</h3>
              <p>Get started by creating your first system user.</p>
              <button onClick={() => setShowCreateForm(true)} className="btn-create-user-large">
                <span className="material-icons">person_add</span>
                Create First User
              </button>
            </div>
          </div>
        ) : (
          <div className="table-container-professional">
            <table className="nodes-table-professional">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>User Details</th>
                  <th>RFID UID</th>
                  <th>Assigned Nodes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.user_id}>
                    <td>
                      <strong>#{user.user_id}</strong>
                    </td>
                    <td>
                      <div className="user-identity-table">
                        <div className="user-avatar-small">
                          <span className="material-icons">person</span>
                        </div>
                        <div className="user-details">
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="rfid-code">{user.rfid_uid}</code>
                    </td>
                    <td>
                      <div className="assigned-nodes">
                        {user.assigned_nodes && user.assigned_nodes.length > 0 ? (
                          <div className="nodes-list">
                            {user.assigned_nodes.map(nodeId => {
                              const node = nodes.find(n => n.node_id === nodeId);
                              return (
                                <span key={nodeId} className="node-tag">
                                  <span className="material-icons icon-sm">
                                    {node?.type === 'dustbin' ? 'delete' : 'lock'}
                                  </span>
                                  {nodeId}
                                  <button 
                                    onClick={() => handleRemoveNode(user.user_id, nodeId)}
                                    className="remove-node-btn"
                                    title="Remove node assignment"
                                  >
                                    <span className="material-icons icon-sm">close</span>
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="no-nodes">
                            <span className="material-icons icon-sm">block</span>
                            No nodes assigned
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <select 
                          onChange={(e) => handleAssignNode(user.user_id, e.target.value)}
                          defaultValue=""
                          className="form-select"
                        >
                          <option value="">Assign Node</option>
                          {getAvailableNodes(user).map(node => (
                            <option key={node.node_id} value={node.node_id}>
                              {node.node_id} - {node.location} ({node.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;