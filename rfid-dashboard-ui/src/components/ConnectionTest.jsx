import React, { useState, useEffect } from 'react';
import { checkHealth, getNodes, getUsers } from '../services/api';
import '../styles/ConnectionTest.css';
const ConnectionTest = () => {
  const [status, setStatus] = useState('testing');
  const [results, setResults] = useState({});

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('testing');
      
      // Test 1: Health check
      const health = await checkHealth();
      setResults(prev => ({ ...prev, health }));

      // Test 2: Get nodes
      const nodes = await getNodes();
      setResults(prev => ({ ...prev, nodes: `Found ${nodes.length} nodes` }));

      // Test 3: Get users
      const users = await getUsers();
      setResults(prev => ({ ...prev, users: `Found ${users.length} users` }));

      setStatus('success');
    } catch (error) {
      setStatus('error');
      setResults(prev => ({ ...prev, error: error.message }));
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'schedule';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      default:
        return 'orange';
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>
        <span className="material-icons">link</span>
        Connection Test
      </h3>
      <p>
        Status: 
        <span style={{ 
          color: getStatusColor(),
          fontWeight: 'bold',
          marginLeft: '10px'
        }}>
          <span className="material-icons">{getStatusIcon()}</span>
          {status.toUpperCase()}
        </span>
      </p>
      
      <div>
        <h4>Test Results:</h4>
        <pre>{JSON.stringify(results, null, 2)}</pre>
      </div>
      
      <button onClick={testConnection}>
        <span className="material-icons">refresh</span>
        Test Again
      </button>
    </div>
  );
};

export default ConnectionTest;