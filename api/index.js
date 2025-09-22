// Vercel Serverless API - Backend
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

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
    const existingUser = Object.values(users).find(u => u.phoneNumber === phoneNumber);
    if (existingUser) {
      // User exists, just log them in
      const token = generateToken(existingUser.id);
      return res.json({ 
        token, 
        user: { 
          id: existingUser.id, 
          name: existingUser.name, 
          phoneNumber: existingUser.phoneNumber, 
          balance: existingUser.balance 
        },
        isNewUser: false
      });
    }
    
    // Create new user
    const userId = uuidv4();
    users[userId] = {
      id: userId,
      name,
      phoneNumber,
      createdAt: Date.now(),
      balance: 1000 // Starting balance for demo
    };
    
    const token = generateToken(userId);
    res.json({ 
      token, 
      user: { 
        id: userId, 
        name, 
        phoneNumber, 
        balance: 1000 
      },
      isNewUser: true
    });
  } catch (error) {
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

// Export for Vercel
module.exports = app;
