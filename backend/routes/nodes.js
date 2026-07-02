// routes/nodes.js
import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; // ✅ Use session-based auth

const router = express.Router();

// Apply session authentication to all node routes
router.use(authenticateToken);

// Get all nodes
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM nodes ORDER BY node_id';
    const [results] = await db.execute(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching nodes:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// Update node status
router.put('/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { status } = req.body;
    
    const query = 'UPDATE nodes SET status = ? WHERE node_id = ?';
    const [results] = await db.execute(query, [status, nodeId]);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating node:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;