import db from '../config/database.js';

export const getUsersWithNodes = (req, res) => {
  const query = `
    SELECT 
      u.user_id, 
      u.name, 
      u.email, 
      u.rfid_uid, 
      u.is_active,
      u.created_at,
      GROUP_CONCAT(p.node_id) as assigned_nodes
    FROM users u
    LEFT JOIN user_node_permissions p ON u.user_id = p.user_id
    GROUP BY u.user_id
    ORDER BY u.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    
    const users = results.map(user => ({
      ...user,
      assigned_nodes: user.assigned_nodes ? user.assigned_nodes.split(',') : []
    }));
    
    res.json(users);
  });
};

export const createUser = (req, res) => {
  const { name, email, rfid_uid } = req.body;
  
  if (!name || !rfid_uid) {
    return res.status(400).json({ error: 'Name and RFID UID are required' });
  }
  
  // Check if RFID UID already exists
  const checkQuery = 'SELECT user_id FROM users WHERE rfid_uid = ?';
  
  db.query(checkQuery, [rfid_uid], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ error: 'RFID UID already exists' });
    }
    
    // Insert new user
    const insertQuery = 'INSERT INTO users (name, email, rfid_uid) VALUES (?, ?, ?)';
    
    db.query(insertQuery, [name, email, rfid_uid], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to create user' });
      }
      
      res.json({ 
        success: true, 
        user_id: results.insertId,
        message: 'User created successfully'
      });
    });
  });
};

export const assignNodeToUser = (req, res) => {
  const { user_id, node_id } = req.body;
  
  if (!user_id || !node_id) {
    return res.status(400).json({ error: 'User ID and Node ID are required' });
  }
  
  // Check if assignment already exists
  const checkQuery = 'SELECT id FROM user_node_permissions WHERE user_id = ? AND node_id = ?';
  
  db.query(checkQuery, [user_id, node_id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ error: 'Node already assigned to user' });
    }
    
    // Create assignment
    const insertQuery = 'INSERT INTO user_node_permissions (user_id, node_id) VALUES (?, ?)';
    
    db.query(insertQuery, [user_id, node_id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to assign node to user' });
      }
      
      res.json({ 
        success: true,
        message: 'Node assigned to user successfully'
      });
    });
  });
};

export const getAccessLogs = (req, res) => {
  const { startDate, endDate, action, userId, nodeId } = req.query;
  
  let query = `
    SELECT 
      al.log_id,
      al.user_id,
      al.node_id,
      al.action,
      al.notes,
      al.timestamp,
      al.closed_timestamp,
      u.name as user_name,
      n.location,
      n.type as node_type
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
  
  if (userId) {
    query += ' AND al.user_id = ?';
    params.push(userId);
  }
  
  if (nodeId) {
    query += ' AND al.node_id = ?';
    params.push(nodeId);
  }
  
  query += ' ORDER BY al.timestamp DESC LIMIT 200';
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch access logs' });
    }
    res.json(results);
  });
};

export const getSystemStats = (req, res) => {
  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM nodes) as total_nodes,
      (SELECT COUNT(*) FROM access_logs WHERE DATE(timestamp) = CURDATE()) as today_accesses,
      (SELECT COUNT(*) FROM access_logs WHERE action = 'access_denied' AND DATE(timestamp) = CURDATE()) as today_denials
  `;
  
  db.query(statsQuery, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch system statistics' });
    }
    res.json(results[0]);
  });
};