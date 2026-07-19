import React, { useState } from 'react';
import { updateNode } from '../../services/api';
import '../../styles/NodeCard.css';
const NodeCard = ({ node, onUpdate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    location: node.location,
    status: node.status
  });

  const statusConfig = {
    available: {
      label: 'Available',
      color: 'var(--success)',
      bgColor: 'var(--success-light)',
      icon: '✅'
    },
    occupied: {
      label: 'In Use',
      color: 'var(--warning)',
      bgColor: 'var(--warning-light)',
      icon: '🔄'
    },
    maintenance: {
      label: 'Maintenance',
      color: 'var(--error)',
      bgColor: 'var(--error-light)',
      icon: '🛠️'
    }
  };

  const status = statusConfig[node.status] || statusConfig.available;

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateNode(node.node_id, { status: newStatus });
      onUpdate();
    } catch (error) {
      console.error('Error updating node status:', error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateNode(node.node_id, editForm);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating node:', error);
    }
  };

  return (
    <div className="node-card-professional">
      {/* Card Header */}
      <div className="node-card-header">
        <div className="node-info">
          <div className="node-type-icon">
            {node.type === 'dustbin' ? '🗑️' : '🔒'}
          </div>
          <div className="node-identity">
            <h3 className="node-id">{node.node_id}</h3>
            <span className="node-type">{node.type}</span>
          </div>
        </div>
        <div className="node-actions">
          <button 
            className="action-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            •••
          </button>
          {isMenuOpen && (
            <div className="dropdown-menu">
              <button onClick={() => setIsEditing(true)}>✏️ Edit</button>
              <button onClick={() => handleStatusUpdate('maintenance')}>🛠️ Maintenance</button>
              <button onClick={() => handleStatusUpdate('available')}>✅ Available</button>
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div 
        className="status-badge-professional"
        style={{ 
          backgroundColor: status.bgColor,
          color: status.color,
          borderColor: status.color
        }}
      >
        <span className="status-icon">{status.icon}</span>
        {status.label}
      </div>

      {/* Location */}
      <div className="node-location">
        {isEditing ? (
          <input
            type="text"
            value={editForm.location}
            onChange={(e) => setEditForm({...editForm, location: e.target.value})}
            className="edit-input-professional"
            placeholder="Enter location..."
          />
        ) : (
          <p>{node.location}</p>
        )}
      </div>

      {/* Last Activity */}
      <div className="node-meta">
        <span className="meta-item">
          <span className="meta-label">Last Updated:</span>
          <span className="meta-value">Just now</span>
        </span>
      </div>

      {/* Action Buttons */}
      <div className="node-actions-footer">
        {isEditing ? (
          <div className="edit-actions">
            <button 
              className="btn-success-small"
              onClick={handleSaveEdit}
            >
              Save
            </button>
            <button 
              className="btn-secondary-small"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="quick-actions">
            <button 
              className={`status-btn ${node.status === 'available' ? 'active' : ''}`}
              onClick={() => handleStatusUpdate('available')}
            >
              Available
            </button>
            <button 
              className={`status-btn ${node.status === 'occupied' ? 'active' : ''}`}
              onClick={() => handleStatusUpdate('occupied')}
            >
              In Use
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeCard;