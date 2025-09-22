// Vercel Serverless API - Backend
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Import models
const User = require('./models/User');
const Message = require('./models/Message');
const Chat = require('./models/Chat');
const MessagingService = require('./services/MessagingService');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/messaging-mvp';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Initialize Socket.io
const server = require('http').createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize messaging service
const messagingService = new MessagingService(io);

// JWT secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'super-app-secret-key';

// In-memory stores (replace with DB for production)
const users = {}; // phoneNumber => user
const messages = {}; // roomId => [messages]
const invoices = {}; // invoiceId => invoice
const receipts = {}; // receiptId => receipt
const payments = {}; // paymentId => payment
const rooms = {}; // roomId => room

// Initialize default data
const defaultRoom = {
  id: 'main',
  name: 'Main Chat',
  type: 'public',
  participants: [],
  createdAt: Date.now()
};
rooms['main'] = defaultRoom;

// Helper function to generate JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Helper function to verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  
  req.userId = decoded.userId;
  next();
}

// REST API endpoints

// Phone number signup/verification
app.post('/api/signup', async (req, res) => {
  try {
    const { phoneNumber, name, verificationCode } = req.body;
    
    if (!phoneNumber || !name) {
      return res.status(400).json({ error: 'Phone number and name are required' });
    }
    
    // In a real app, you'd verify the verification code here
    // For now, we'll accept any code for demo purposes
    if (!verificationCode) {
      return res.status(400).json({ error: 'Verification code is required' });
    }
    
    // Check if user already exists
    let user = await User.findOne({ phoneNumber });
    if (user) {
      // User exists, just log them in
      const token = generateToken(user._id);
      return res.json({ 
        token, 
        user: { 
          id: user._id, 
          name: user.name, 
          phoneNumber: user.phoneNumber, 
          balance: user.balance,
          profilePicture: user.profilePicture,
          status: user.status
        },
        isNewUser: false
      });
    }
    
    // Create new user
    user = new User({
      name,
      phoneNumber,
      balance: 1000 // Starting balance for demo
    });
    
    await user.save();
    
    const token = generateToken(user._id);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name, 
        phoneNumber, 
        balance: 1000,
        profilePicture: user.profilePicture,
        status: user.status
      },
      isNewUser: true
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send verification code (simulated)
app.post('/api/send-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // In a real app, you'd integrate with SMS service like Twilio
    // For now, we'll simulate sending a code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code temporarily (in production, use Redis with expiration)
    // For demo, we'll just return success
    
    res.json({ 
      success: true, 
      message: `Verification code sent to ${phoneNumber}`,
      demoCode: verificationCode // Remove this in production
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  const user = users[req.userId];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    id: user.id,
    name: user.name,
    phoneNumber: user.phoneNumber,
    balance: user.balance,
    createdAt: user.createdAt
  });
});

// Get rooms
app.get('/api/rooms', authenticateToken, (req, res) => {
  res.json(Object.values(rooms));
});

// Get invoice by id
app.get('/api/invoice/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const invoice = invoices[id];
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  return res.json(invoice);
});

// Get receipt by id
app.get('/api/receipt/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const receipt = receipts[id];
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
  return res.json(receipt);
});

// Get payment by id
app.get('/api/payment/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const payment = payments[id];
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  return res.json(payment);
});

// Process payment
app.post('/api/payment', authenticateToken, (req, res) => {
  try {
    const { to, amount, method } = req.body;
    
    if (!to || !amount || !method) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const user = users[req.userId];
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    const paymentId = uuidv4();
    const payment = {
      id: paymentId,
      from: req.userId,
      to,
      amount: parseFloat(amount),
      method,
      status: 'completed',
      timestamp: Date.now()
    };
    
    payments[paymentId] = payment;
    
    // Update balances
    user.balance -= amount;
    
    res.json({ 
      success: true, 
      payment, 
      newBalance: user.balance 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// New Messaging Endpoints

// Get user chats
app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const chats = await messagingService.getUserChats(req.userId);
    res.json(chats);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get chat messages
app.get('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await messagingService.getChatMessages(chatId, parseInt(page), parseInt(limit));
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or get private chat
app.post('/api/chats/private', authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    
    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }
    
    const chat = await messagingService.getOrCreatePrivateChat(req.userId, otherUserId);
    res.json(chat);
  } catch (error) {
    console.error('Error creating private chat:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
app.get('/api/users/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phoneNumber: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.userId }
    }).select('name phoneNumber profilePicture isOnline lastSeen');
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, status, profilePicture } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (profilePicture) updateData.profilePicture = profilePicture;
    
    const user = await User.findByIdAndUpdate(
      req.userId, 
      updateData, 
      { new: true }
    ).select('name phoneNumber profilePicture status balance');
    
    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export for Vercel
module.exports = app;
