const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
const Message = require('./models/Message');
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

// Route to get all messages
app.get('/api/messages', async (req, res) => {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  });
  
  // Route to send a message
  app.post('/api/messages', async (req, res) => {
    const newMessage = new Message(req.body);
    await newMessage.save();
    io.emit('messageReceived', newMessage); // Broadcast to everyone
    res.status(201).json(newMessage);
  });
  // Route to Pin/Unpin a message
app.patch('/api/messages/:id/pin', async (req, res) => {
    const message = await Message.findById(req.params.id);
    message.isPinned = !message.isPinned; // Toggle pin status
    await message.save();
    io.emit('messageUpdated', message); // Tell everyone it's pinned
    res.json(message);
  });
  
  // Route to Delete a message (Delete for Everyone)
  app.delete('/api/messages/:id', async (req, res) => {
    await Message.findByIdAndDelete(req.params.id);
    io.emit('messageDeleted', req.params.id); // Tell everyone to remove it
    res.status(204).send();
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