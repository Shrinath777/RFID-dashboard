import db from '../config/database.js';

export const handleAccessRequest = (req, res) => {
  const { rfid_uid, requested_node_id } = req.body;
  const io = req.app.get('io');

  console.log(`Access request: RFID ${rfid_uid} for node ${requested_node_id}`);

  // 1. Check if RFID exists and user is active
  const userQuery = `
    SELECT u.* FROM users u 
    WHERE u.rfid_uid = ? AND u.is_active = 1
  `;

  db.query(userQuery, [rfid_uid], (err, userResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (userResults.length === 0) {
      logAccessAttempt(null, requested_node_id, 'access_denied', 'Invalid RFID - No user found');
      return res.json({ 
        access_granted: false, 
        message: 'Invalid RFID card or user not active' 
      });
    }

    const user = userResults[0];

    // 2. Check if user has permission for this node
    const permissionQuery = `
      SELECT * FROM user_node_permissions 
      WHERE user_id = ? AND node_id = ?
    `;

    db.query(permissionQuery, [user.user_id, requested_node_id], (err, permissionResults) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (permissionResults.length === 0) {
        logAccessAttempt(user.user_id, requested_node_id, 'access_denied', 'No permission for this node');
        return res.json({ 
          access_granted: false, 
          message: 'No permission for this node' 
        });
      }

      // 3. Check node availability
      const nodeQuery = `SELECT * FROM nodes WHERE node_id = ? AND status = 'available'`;
      
      db.query(nodeQuery, [requested_node_id], (err, nodeResults) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (nodeResults.length === 0) {
          logAccessAttempt(user.user_id, requested_node_id, 'access_denied', 'Node unavailable');
          return res.json({ 
            access_granted: false, 
            message: 'Node is not available' 
          });
        }

        // 4. Grant access
        const updateNodeQuery = `UPDATE nodes SET status = 'occupied' WHERE node_id = ?`;
        
        db.query(updateNodeQuery, [requested_node_id], (err) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Log successful access
          logAccessAttempt(user.user_id, requested_node_id, 'opened', 'Access granted');

          // Send real-time update
          io.emit('node_status_update', {
            node_id: requested_node_id,
            status: 'occupied',
            user_name: user.name,
            timestamp: new Date()
          });

          res.json({
            access_granted: true,
            command: 'unlock',
            node_id: requested_node_id,
            message: 'Access granted'
          });
        });
      });
    });
  });
};

export const handleStatusUpdate = (req, res) => {
  const { node_id, status } = req.body;
  const io = req.app.get('io');

  console.log(`Status update: Node ${node_id} is now ${status}`);

  const validStatuses = ['available', 'occupied', 'maintenance'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const updateQuery = `UPDATE nodes SET status = ? WHERE node_id = ?`;
  
  db.query(updateQuery, [status, node_id], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Update the latest access log with close time
    if (status === 'available') {
      const updateLogQuery = `
        UPDATE access_logs 
        SET closed_timestamp = NOW() 
        WHERE node_id = ? AND closed_timestamp IS NULL 
        ORDER BY timestamp DESC LIMIT 1
      `;
      db.query(updateLogQuery, [node_id]);
    }

    // Send real-time update
    io.emit('node_status_update', {
      node_id: node_id,
      status: status,
      timestamp: new Date()
    });

    res.json({ success: true, message: 'Status updated successfully' });
  });
};

// Helper function to log access attempts
function logAccessAttempt(user_id, node_id, action, notes = '') {
  const logQuery = `
    INSERT INTO access_logs (user_id, node_id, action, notes) 
    VALUES (?, ?, ?, ?)
  `;
  
  db.query(logQuery, [user_id, node_id, action, notes], (err) => {
    if (err) {
      console.error('Failed to log access attempt:', err);
    }
  });
}