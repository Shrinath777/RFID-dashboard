import db from '../config/database.js';

export const getAllNodes = (req, res) => {
  const query = 'SELECT * FROM nodes ORDER BY node_id';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch nodes' });
    }
    res.json(results);
  });
};

export const updateNodeStatus = (req, res) => {
  const { nodeId } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['available', 'occupied', 'maintenance'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  
  const query = 'UPDATE nodes SET status = ? WHERE node_id = ?';
  
  db.query(query, [status, nodeId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update node status' });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    res.json({ 
      success: true, 
      message: `Node ${nodeId} status updated to ${status}` 
    });
  });
};

export const getNodeStats = (req, res) => {
  const query = `
    SELECT 
      COUNT(*) as total_nodes,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_nodes,
      SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_nodes,
      SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_nodes
    FROM nodes
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch node statistics' });
    }
    res.json(results[0]);
  });
};