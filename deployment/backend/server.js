// Messaging Super App Backend
const express = require('express');
const http = require('http');
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

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }});

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

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join', (data) => {
    const { roomId, token } = data;
    const decoded = verifyToken(token);
    if (decoded) {
      socket.userId = decoded.userId;
      socket.join(roomId);
      
      // Add user to room participants if not already there
      if (!rooms[roomId]) {
        rooms[roomId] = {
          id: roomId,
          name: roomId,
          type: 'public',
          participants: [],
          createdAt: Date.now()
        };
      }
      
      if (!rooms[roomId].participants.includes(decoded.userId)) {
        rooms[roomId].participants.push(decoded.userId);
      }
      
      // send history
      socket.emit('history', messages[roomId] || []);
      socket.emit('roomInfo', rooms[roomId]);
    }
  });

  socket.on('message', (payload) => {
    const { roomId, text, timestamp } = payload;
    const ts = timestamp || Date.now();
    
    if (!socket.userId) return;
    
    // Detect special commands
    if (typeof text === 'string' && text.trim().startsWith('+')) {
      handleSpecialCommand(text, socket.userId, roomId, ts);
      return;
    }

    const msg = {
      id: shortid.generate(),
      userId: socket.userId,
      user: users[socket.userId]?.name || 'Unknown',
      text,
      timestamp: ts,
      type: 'message'
    };
    
    messages[roomId] = messages[roomId] || [];
    messages[roomId].push(msg);
    io.to(roomId).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

// Handle special commands
function handleSpecialCommand(text, userId, roomId, timestamp) {
  const command = text.trim();
  
  if (command.startsWith('+invoice')) {
    handleInvoiceCommand(command, userId, roomId, timestamp);
  } else if (command.startsWith('+receipt')) {
    handleReceiptCommand(command, userId, roomId, timestamp);
  } else if (command.startsWith('+payment')) {
    handlePaymentCommand(command, userId, roomId, timestamp);
  } else if (command.startsWith('+help')) {
    sendHelpMessage(roomId, timestamp);
  }
}

function handleInvoiceCommand(text, userId, roomId, timestamp) {
  const invoice = generateInvoiceFromCommand(text, userId);
  invoices[invoice.id] = invoice;
  
  const invoiceMsg = {
    id: shortid.generate(),
    userId: 'SYSTEM',
    user: 'SYSTEM',
    text: `📄 Invoice generated: ${invoice.id}`,
    invoice,
    timestamp,
    type: 'invoice'
  };
  
  messages[roomId] = messages[roomId] || [];
  messages[roomId].push(invoiceMsg);
  io.to(roomId).emit('message', invoiceMsg);
}

function handleReceiptCommand(text, userId, roomId, timestamp) {
  const receipt = generateReceiptFromCommand(text, userId);
  receipts[receipt.id] = receipt;
  
  const receiptMsg = {
    id: shortid.generate(),
    userId: 'SYSTEM',
    user: 'SYSTEM',
    text: `🧾 Receipt generated: ${receipt.id}`,
    receipt,
    timestamp,
    type: 'receipt'
  };
  
  messages[roomId] = messages[roomId] || [];
  messages[roomId].push(receiptMsg);
  io.to(roomId).emit('message', receiptMsg);
}

function handlePaymentCommand(text, userId, roomId, timestamp) {
  const payment = generatePaymentFromCommand(text, userId);
  payments[payment.id] = payment;
  
  const paymentMsg = {
    id: shortid.generate(),
    userId: 'SYSTEM',
    user: 'SYSTEM',
    text: `💳 Payment processed: ${payment.id}`,
    payment,
    timestamp,
    type: 'payment'
  };
  
  messages[roomId] = messages[roomId] || [];
  messages[roomId].push(paymentMsg);
  io.to(roomId).emit('message', paymentMsg);
}

function sendHelpMessage(roomId, timestamp) {
  const helpMsg = {
    id: shortid.generate(),
    userId: 'SYSTEM',
    user: 'SYSTEM',
    text: `🤖 Available commands:
+invoice recipient=Name;item=Item;qty=1;price=100
+receipt business=Business;item=Item;amount=100;payment=Card
+payment to=Recipient;amount=100;method=EFT
+help - Show this help message`,
    timestamp,
    type: 'help'
  };
  
  messages[roomId] = messages[roomId] || [];
  messages[roomId].push(helpMsg);
  io.to(roomId).emit('message', helpMsg);
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

function generateInvoiceFromCommand(text, userId) {
  const body = text.replace('+invoice', '').trim();
  const parts = body.split(';').map(s => s.trim()).filter(Boolean);
  const data = {};
  parts.forEach(p => {
    const [k,v] = p.split('=');
    if (k && v) data[k.trim()] = v.trim();
  });
  
  const qty = parseFloat(data.qty || '1') || 1;
  const price = parseFloat(data.price || '0') || 0;
  const total = qty * price;
  const id = shortid.generate();
  
  return {
    id,
    createdBy: userId,
    recipient: data.recipient || 'Customer',
    line_items: [
      { description: data.item || 'Item', qty, unit_price: price, total }
    ],
    total,
    status: 'pending',
    createdAt: Date.now()
  };
}

function generateReceiptFromCommand(text, userId) {
  const body = text.replace('+receipt', '').trim();
  const parts = body.split(';').map(s => s.trim()).filter(Boolean);
  const data = {};
  parts.forEach(p => {
    const [k,v] = p.split('=');
    if (k && v) data[k.trim()] = v.trim();
  });
  
  const amount = parseFloat(data.amount || '0') || 0;
  const id = shortid.generate();
  
  return {
    id,
    createdBy: userId,
    business: data.business || 'Business',
    item: data.item || 'Item',
    amount,
    paymentMethod: data.payment || 'Cash',
    timestamp: Date.now()
  };
}

function generatePaymentFromCommand(text, userId) {
  const body = text.replace('+payment', '').trim();
  const parts = body.split(';').map(s => s.trim()).filter(Boolean);
  const data = {};
  parts.forEach(p => {
    const [k,v] = p.split('=');
    if (k && v) data[k.trim()] = v.trim();
  });
  
  const amount = parseFloat(data.amount || '0') || 0;
  const id = uuidv4();
  
  return {
    id,
    from: userId,
    to: data.to || 'Recipient',
    amount,
    method: data.method || 'EFT',
    status: 'pending',
    timestamp: Date.now()
  };
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Messaging Super App Server listening on', PORT));
