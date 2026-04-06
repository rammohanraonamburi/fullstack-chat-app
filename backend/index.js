const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB 🟢'))
  .catch(err => console.error('MongoDB connection error 🔴:', err));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});



app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    if (!req.body.content || req.body.content.trim() === '') {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const newMessage = new Message(req.body);
    await newMessage.save();
    
    io.emit('messageReceived', newMessage); 
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.patch('/api/messages/:id/pin', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    
    message.isPinned = !message.isPinned;
    await message.save();
    
    io.emit('messageUpdated', message);
    res.json(message);
  } catch (error) {
    console.error("Error pinning message:", error);
    res.status(500).json({ error: 'Failed to pin message' });
  }
});

app.patch('/api/messages/:id/deleteForEveryone', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    message.deletedForEveryone = true;
    message.content = "🚫 This message was deleted"; 
    message.isPinned = false; 
    await message.save();
    
    io.emit('messageUpdated', message);
    res.json(message);
  } catch (error) {
    console.error("Error deleting message for everyone:", error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

app.patch('/api/messages/:id/deleteForMe', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    
    if (!message.hiddenBy.includes(userId)) {
      message.hiddenBy.push(userId);
      await message.save();
    }
    
    res.json(message); 
  } catch (error) {
    console.error("Error hiding message for user:", error);
    res.status(500).json({ error: 'Failed to hide message' });
  }
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});