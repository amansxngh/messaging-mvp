const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'contact'],
    default: 'text'
  },
  mediaUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read'],
    default: 'sending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  forwarded: {
    type: Boolean,
    default: false
  }
});

// Index for efficient querying
messageSchema.index({ chat: 1, timestamp: -1 });
messageSchema.index({ sender: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
