import React from 'react';
import '../../styles/QuickActions.css';
const QuickActions = () => {
  const actions = [
    { 
      icon: '➕', 
      label: 'Add Node', 
      action: 'createNode',
      description: 'Create new RFID node'
    },
    { 
      icon: '👥', 
      label: 'Manage Users', 
      action: 'manageUsers',
      description: 'User management'
    },
    { 
      icon: '📊', 
      label: 'Generate Report', 
      action: 'generateReport',
      description: 'Export system data'
    },
    { 
      icon: '🔄', 
      label: 'Refresh Data', 
      action: 'refreshData',
      description: 'Reload all data'
    }
  ];

  const handleAction = (action) => {
    console.log(`Quick action: ${action}`);
    // These would trigger modals or navigation in your app
    switch (action) {
      case 'createNode':
        // Open create node modal
        break;
      case 'manageUsers':
        // Navigate to user management
        break;
      case 'generateReport':
        // Generate report functionality
        break;
      case 'refreshData':
        window.location.reload();
        break;
      default:
        break;
    }
  };

  return (
    <div className="quick-actions-card">
      <div className="card-header">
        <h3>Quick Actions</h3>
        <span className="card-subtitle">Frequently used operations</span>
      </div>
      
      <div className="actions-grid">
        {actions.map((item, index) => (
          <button
            key={index}
            className="action-btn"
            onClick={() => handleAction(item.action)}
            title={item.description}
          >
            <span className="action-icon">{item.icon}</span>
            <span className="action-label">{item.label}</span>
            <span className="action-description">{item.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;