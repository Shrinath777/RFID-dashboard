import React, { useState, useEffect } from 'react';
import { getNodes } from '../../services/api';
import NodeManagement from '../NodeManagement';
import CreateNodeForm from '../CreateNodeForm';
import '../../styles/ManagementSection.css';
const ManagementSection = () => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState({ total: 0, dustbins: 0, lockers: 0 });

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    try {
      const data = await getNodes();
      setNodes(data);
      
      // Calculate stats
      const dustbins = data.filter(node => node.type === 'dustbin').length;
      const lockers = data.filter(node => node.type === 'locker').length;
      setStats({
        total: data.length,
        dustbins,
        lockers
      });
    } catch (error) {
      console.error('Error loading nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeCreated = () => {
    setShowCreateForm(false);
    loadNodes();
  };

  const handleNodeUpdated = () => {
    loadNodes();
  };

  const handleNodeDeleted = () => {
    loadNodes();
  };

  if (loading) {
    return (
      <div className="section-loading-enhanced">
        <div className="loading-content">
          <div className="loading-spinner-professional"></div>
          <div className="loading-text">
            <h3>Loading Node Management</h3>
            <p>Fetching all RFID nodes data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="management-section-enhanced">
      {/* Enhanced Header with Stats */}
      
      {/* Enhanced Modal */}
      {showCreateForm && (
        <div className="modal-overlay-enhanced">
          <div className="modal-content-enhanced">
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
              <CreateNodeForm onNodeCreated={handleNodeCreated} />
            </div>
          </div>
        </div>
      )}

      {/* Node Management Table with Proper Spacing */}
      <div className="management-content" style={{ marginTop: '2rem' }}>
        <NodeManagement 
          nodes={nodes}
          onNodeUpdated={handleNodeUpdated}
          onNodeDeleted={handleNodeDeleted}
        />
      </div>
    </div>
  );
};

export default ManagementSection;