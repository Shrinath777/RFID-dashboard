import React, { useState } from 'react';
import { createNode } from '../services/api';
import '../styles/CreateNodeModal.css';
const CreateNodeModal = ({ onClose, onNodeCreated }) => {
  const [formData, setFormData] = useState({
    node_id: '',
    location: '',
    type: 'dustbin',
    status: 'available'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await createNode(formData);
      setMessage('Node created successfully!');
      setTimeout(() => {
        onNodeCreated();
      }, 1000);
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getTypeIcon = (type) => {
    return type === 'dustbin' ? 'delete' : 'lock';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Node</h2>
          <button className="modal-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid-modal">
            <div className="form-group">
              <label>Node ID *</label>
              <input
                type="text"
                name="node_id"
                value={formData.node_id}
                onChange={handleChange}
                placeholder="e.g., DBIN_001, LKR_001"
                required
                className="form-input"
              />
              <small>Unique identifier for the node</small>
            </div>

            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Floor 1 - Entrance"
                required
                className="form-input"
              />
              <small>Physical location of the node</small>
            </div>

            <div className="form-group">
              <label>Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="dustbin">
                  <span className="material-icons">delete</span>
                  Dustbin
                </option>
                <option value="locker">
                  <span className="material-icons">lock</span>
                  Locker
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Initial Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="available">
                  <span className="material-icons">check_circle</span>
                  Available
                </option>
                <option value="maintenance">
                  <span className="material-icons">build</span>
                  Maintenance
                </option>
              </select>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
              <span className="material-icons">
                {message.includes('successfully') ? 'check_circle' : 'error'}
              </span>
              {message}
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              <span className="material-icons">cancel</span>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="material-icons">hourglass_empty</span>
                  Creating...
                </>
              ) : (
                <>
                  <span className="material-icons">add_circle</span>
                  Create Node
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNodeModal;