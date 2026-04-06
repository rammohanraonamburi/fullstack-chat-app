const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Initialize the Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io for real-time features
const io = new Server(server, {
  cors: {
    origin: '*', // Allows your frontend to connect
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to parse JSON data from requests

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB 🟢'))
  .catch((err) => console.error('MongoDB connection error 🔴:', err));

// Real-time connection listener
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// A simple test route
app.get('/', (req, res) => {
  res.send('Chat App Backend is running...');
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});