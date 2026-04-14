const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all listings
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, u.name AS seller_name, u.email AS seller_email
      FROM listings l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Get listings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get my listings
router.get('/mine', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get my listings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create listing
router.post('/', auth, async (req, res) => {
  try {
    const { ticket_type, source, destination, date, seat_details, description } = req.body;
    if (!ticket_type) {
      return res.status(400).json({ error: 'Ticket type is required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO listings (user_id, ticket_type, source, destination, date, seat_details, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, ticket_type, source || null, destination || null, date || null, seat_details || null, description || null]
    );

    res.status(201).json({ id: result.insertId, message: 'Listing created successfully.' });
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete listing
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this listing.' });
    }

    await pool.query('DELETE FROM listings WHERE id = ?', [req.params.id]);
    res.json({ message: 'Listing deleted successfully.' });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
