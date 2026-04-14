require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.name} (${socket.user.id})`);

  // Join a chat room for a specific listing
  socket.on('joinRoom', ({ listingId }) => {
    const room = `listing_${listingId}`;
    socket.join(room);
    console.log(`${socket.user.name} joined room ${room}`);
  });

  // Handle sending messages
  socket.on('sendMessage', async ({ listingId, receiverId, message }) => {
    try {
      const room = `listing_${listingId}`;

      // Save message to database
      const [result] = await pool.query(
        'INSERT INTO messages (sender_id, receiver_id, listing_id, message) VALUES (?, ?, ?, ?)',
        [socket.user.id, receiverId, listingId, message]
      );

      const msgData = {
        id: result.insertId,
        sender_id: socket.user.id,
        sender_name: socket.user.name,
        receiver_id: receiverId,
        listing_id: listingId,
        message: message,
        timestamp: new Date().toISOString()
      };

      // Broadcast to room
      io.to(room).emit('receiveMessage', msgData);
    } catch (err) {
      console.error('Send message error:', err);
      socket.emit('error', { message: 'Failed to send message.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.name}`);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Sitchange server running on http://localhost:${PORT}`);
});
