const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Get messages for a listing between current user and the seller
router.get('/:listingId', auth, async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const userId = req.user.id;

    const [messages] = await pool.query(`
      SELECT m.*, u.name AS sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.listing_id = ?
      ORDER BY m.timestamp ASC
    `, [listingId]);

    res.json(messages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
