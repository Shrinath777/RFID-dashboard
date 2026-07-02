import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// RFID Access Request - UPDATED FOR YOUR SCHEMA
router.post('/request', async (req, res) => {
  const { rfid_uid, requested_node_id } = req.body;
  
  try {
    console.log(`🔐 Access request: RFID ${rfid_uid} for node ${requested_node_id}`);
    
    // 1. Check if user exists with this RFID
    const [users] = await db.execute(
      'SELECT * FROM users WHERE rfid_uid = ? AND is_active = TRUE', 
      [rfid_uid]
    );
    
    if (users.length === 0) {
      return res.json({ 
        access_granted: false, 
        reason: 'User not found' 
      });
    }
    
    const user = users[0];
    
    // 2. Check node exists and available
    const [nodes] = await db.execute(
      'SELECT * FROM nodes WHERE node_id = ?', 
      [requested_node_id]
    );
    
    if (nodes.length === 0) {
      return res.json({ 
        access_granted: false, 
        reason: 'Node not found' 
      });
    }
    
    const node = nodes[0];
    
    if (node.status !== 'available') {
      return res.json({ 
        access_granted: false, 
        reason: 'Node not available' 
      });
    }
    
    // 3. Check user permissions using user_node_permissions table
    const [permissions] = await db.execute(
      'SELECT * FROM user_node_permissions WHERE user_id = ? AND node_id = ?',
      [user.user_id, requested_node_id]
    );
    
    if (permissions.length === 0) {
      return res.json({ 
        access_granted: false, 
        reason: 'Not authorized' 
      });
    }
    
    // 4. Grant access
    console.log('✅ Access granted for user:', user.name);
    
    // Update node status
    await db.execute(
      'UPDATE nodes SET status = "occupied" WHERE node_id = ?',
      [requested_node_id]
    );
    
    // Log access
    await db.execute(
      'INSERT INTO access_logs (user_id, node_id, action, notes) VALUES (?, ?, "opened", ?)',
      [user.user_id, requested_node_id, `Access via RFID ${rfid_uid}`]
    );
    
    // WebSocket broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('nodeStatusUpdate', {
        nodeId: requested_node_id,
        status: 'occupied',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ 
      access_granted: true, 
      user: user.name,
      node: requested_node_id
    });
    
  } catch (error) {
    console.error('Access request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;