const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    default: 'User', // We can enhance this later
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  deletedForEveryone: {
    type: Boolean,
    default: false,
  },
  // To handle "Delete for Me", we store IDs of users who hid it
  hiddenBy: [String], 
});

module.exports = mongoose.model('Message', MessageSchema);