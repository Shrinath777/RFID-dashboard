import React, { useState } from 'react';
import { createNode } from '../services/api';
import '../styles/CreateNodeForm.css';
const CreateNodeForm = ({ onNodeCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    node_id: '',
    type: 'locker',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.node_id.trim() || !formData.location.trim()) {
      setError('Node ID and Location are required');
      setLoading(false);
      return;
    }

    try {
      await createNode(formData);
      onNodeCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create node');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  return (
    <div className="create-node-form">
      

      <form onSubmit={handleSubmit} className="form-content">
        <div className="form-group">
          <label>Node ID *</label>
          <input
            type="text"
            name="node_id"
            value={formData.node_id}
            onChange={handleChange}
            placeholder="e.g., LKR_001, DBIN_001"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Location *</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Building A, Floor 2"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Type *</label>
          <div className="type-options">
            <button
              type="button"
              className={`type-btn ${formData.type === 'locker' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'locker' }))}
            >
              <span className="material-icons">lock</span>
              Locker
            </button>
            <button
              type="button"
              className={`type-btn ${formData.type === 'dustbin' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'dustbin' }))}
            >
              <span className="material-icons">delete</span>
              Dustbin
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span className="material-icons">error</span>
            {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="primary">
            {loading ? 'Creating...' : 'Create Node'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNodeForm;