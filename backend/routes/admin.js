import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Get all users with their assigned nodes
router.get('/users', async (req, res) => {
  try {
    const query = `
      SELECT u.*, GROUP_CONCAT(un.node_id) as assigned_nodes
      FROM users u
      LEFT JOIN user_nodes un ON u.user_id = un.user_id
      GROUP BY u.user_id
    `;
    
    const [results] = await db.execute(query);
    
    const users = results.map(user => ({
      ...user,
      assigned_nodes: user.assigned_nodes ? user.assigned_nodes.split(',') : []
    }));
    
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { name, email, rfid_uid } = req.body;
    
    // Validate required fields
    if (!name || !rfid_uid) {
      return res.status(400).json({ error: 'Name and RFID UID are required' });
    }
    
    const query = 'INSERT INTO users (name, email, rfid_uid) VALUES (?, ?, ?)';
    const [results] = await db.execute(query, [name, email || null, rfid_uid]);
    
    res.json({ success: true, user_id: results.insertId });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Assign node to user
router.post('/assign-node', async (req, res) => {
  try {
    const { user_id, node_id } = req.body;
    
    if (!user_id || !node_id) {
      return res.status(400).json({ error: 'User ID and Node ID are required' });
    }
    
    const query = 'INSERT INTO user_nodes (user_id, node_id) VALUES (?, ?)';
    await db.execute(query, [user_id, node_id]);
    
    res.json({ success: true, message: 'Node assigned successfully' });
  } catch (err) {
    console.error('Error assigning node:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Create new node - SINGLE ENDPOINT (removed duplicate)
router.post('/nodes', async (req, res) => {
  try {
    const { node_id, type, location, capacity } = req.body;

    // Validate required fields
    if (!node_id || !type || !location) {
      return res.status(400).json({ 
        error: 'Missing required fields: node_id, type, and location are required' 
      });
    }

    // Convert undefined values to null and set default status
    const cleanData = {
      node_id: node_id || null,
      type: type || null,
      location: location || null,
      status: 'unknown', // Default status until controller updates it
      capacity: capacity !== undefined ? capacity : null
    };

    // Ensure no undefined values remain
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        cleanData[key] = null;
      }
    });

    console.log('Creating node with data:', cleanData);

    const [result] = await db.execute(
      'INSERT INTO nodes (node_id, type, location, status, capacity) VALUES (?, ?, ?, ?, ?)',
      [cleanData.node_id, cleanData.type, cleanData.location, cleanData.status, cleanData.capacity]
    );

    res.json({ 
      success: true,
      message: 'Node created successfully', 
      node_id: cleanData.node_id 
    });
    
  } catch (error) {
    console.error('Error creating node:', error);
    res.status(500).json({ 
      error: 'Failed to create node',
      details: error.message 
    });
  }
});

// Update node
router.put('/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { location, status } = req.body;
    
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }
    
    const query = 'UPDATE nodes SET location = ?, status = ? WHERE node_id = ?';
    const [results] = await db.execute(query, [location, status || 'unknown', nodeId]);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    res.json({ success: true, message: 'Node updated successfully' });
  } catch (err) {
    console.error('Error updating node:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Delete node
router.delete('/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    
    // First delete any user assignments for this node
    await db.execute('DELETE FROM user_nodes WHERE node_id = ?', [nodeId]);
    
    // Then delete the node
    const query = 'DELETE FROM nodes WHERE node_id = ?';
    const [results] = await db.execute(query, [nodeId]);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    res.json({ success: true, message: 'Node deleted successfully' });
  } catch (err) {
    console.error('Error deleting node:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Get all nodes
router.get('/nodes', async (req, res) => {
  try {
    const query = 'SELECT * FROM nodes ORDER BY node_id';
    const [results] = await db.execute(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching nodes:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get access logs
router.get('/access-logs', async (req, res) => {
  try {
    const { startDate, endDate, action } = req.query;
    
    let query = `
      SELECT al.*, u.name as user_name, n.location, n.type as node_type
      FROM access_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      LEFT JOIN nodes n ON al.node_id = n.node_id
      WHERE 1=1
    `;
    const params = [];
    
    if (startDate) {
      query += ' AND DATE(al.timestamp) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(al.timestamp) <= ?';
      params.push(endDate);
    }
    
    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }
    
    query += ' ORDER BY al.timestamp DESC LIMIT 100';
    
    const [results] = await db.execute(query, params);
    res.json(results);
  } catch (err) {
    console.error('Error fetching access logs:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM nodes) as total_nodes,
        (SELECT COUNT(*) FROM nodes WHERE status = 'available') as available_nodes,
        (SELECT COUNT(*) FROM nodes WHERE status = 'occupied') as occupied_nodes,
        (SELECT COUNT(*) FROM nodes WHERE status = 'maintenance') as maintenance_nodes,
        (SELECT COUNT(*) FROM nodes WHERE status = 'unknown') as unknown_nodes,
        (SELECT COUNT(*) FROM access_logs WHERE DATE(timestamp) = CURDATE()) as today_accesses,
        (SELECT COUNT(*) FROM access_logs WHERE action = 'access_denied' AND DATE(timestamp) = CURDATE()) as today_denials
    `;
    
    const [results] = await db.execute(statsQuery);
    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

// Remove node assignment from user
router.delete('/user-nodes/:userId/:nodeId', async (req, res) => {
  try {
    const { userId, nodeId } = req.params;
    
    const query = 'DELETE FROM user_nodes WHERE user_id = ? AND node_id = ?';
    const [results] = await db.execute(query, [userId, nodeId]);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    res.json({ success: true, message: 'Node assignment removed successfully' });
  } catch (err) {
    console.error('Error removing node assignment:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

export default router;