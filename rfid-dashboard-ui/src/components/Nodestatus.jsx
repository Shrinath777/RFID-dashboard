import React from 'react';
import '../styles/NodeStatus.css';
const NodeStatus = ({ node, color, statusText }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return 'check_circle';
      case 'occupied':
        return 'autorenew';
      case 'maintenance':
        return 'build';
      default:
        return 'help';
    }
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'dustbin':
        return 'delete';
      case 'locker':
        return 'lock';
      default:
        return 'device_hub';
    }
  };

  return (
    <div className={`dustbin-card ${node.status}`}>
      <div className="dustbin-header">
        <div className="dustbin-id">{node.node_id}</div>
        <div className="dustbin-type">
          <span className="material-icons icon-sm">{getNodeIcon(node.type)}</span>
          {node.type}
        </div>
      </div>
      
      <div className="dustbin-location">
        <span className="material-icons icon-sm">location_on</span>
        {node.location}
      </div>
      
      <div className="dustbin-status">
        <div className={`status-badge ${node.status}`}>
          <span className="material-icons icon-sm">{getStatusIcon(node.status)}</span>
          {statusText}
        </div>
        <div 
          className="dustbin-indicator"
          style={{ backgroundColor: color }}
        ></div>
      </div>
      
      <div className="dustbin-info">
        <div className="info-item">
          <span className="info-label">Type:</span>
          <span className="info-value">{node.type}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Status:</span>
          <span className="info-value">{statusText}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Last Updated:</span>
          <span className="info-value">Just now</span>
        </div>
      </div>
    </div>
  );
};

export default NodeStatus;