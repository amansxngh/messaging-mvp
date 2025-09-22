import React, { useState, useEffect, useRef } from 'react';
import { Send, HelpCircle, MessageCircle, FileText, Receipt, CreditCard } from 'lucide-react';

export default function Chat({ user, socket }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentRoom, setCurrentRoom] = useState('main');
  const [rooms, setRooms] = useState([
    { id: 'main', name: 'Main Chat', active: true },
    { id: 'business', name: 'Business', active: false },
    { id: 'support', name: 'Support', active: false }
  ]);
  const [showCommands, setShowCommands] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.emit('join', { roomId: currentRoom, token: localStorage.getItem('token') });
      
      socket.on('history', (history) => {
        setMessages(history || []);
      });
      
      socket.on('message', (message) => {
        setMessages(prev => [...prev, message]);
      });
      
      socket.on('roomInfo', (roomInfo) => {
        console.log('Room info:', roomInfo);
      });
    }
  }, [socket, currentRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !socket) return;
    
    socket.emit('message', {
      roomId: currentRoom,
      text: inputText,
      timestamp: Date.now()
    });
    
    setInputText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const changeRoom = (roomId) => {
    setCurrentRoom(roomId);
    setMessages([]);
    setRooms(prev => prev.map(room => ({
      ...room,
      active: room.id === roomId
    })));
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message) => {
    const isOwnMessage = message.userId === user.id;
    
    return (
      <div key={message.id} className={`message ${isOwnMessage ? 'own' : ''} ${message.type || 'message'}`}>
        <div className="message-header">
          <span className="message-user">{message.user}</span>
          <span className="message-time">{formatTimestamp(message.timestamp)}</span>
        </div>
        
        <div className="message-content">
          {message.text}
          
          {message.invoice && (
            <div className="message-attachment invoice">
              <div className="attachment-header">
                <FileText size={16} />
                <span>Invoice Generated</span>
              </div>
              <div className="attachment-details">
                <div>ID: {message.invoice.id}</div>
                <div>Recipient: {message.invoice.recipient}</div>
                <div>Total: R{message.invoice.total}</div>
              </div>
            </div>
          )}
          
          {message.receipt && (
            <div className="message-attachment receipt">
              <div className="attachment-header">
                <Receipt size={16} />
                <span>Receipt Generated</span>
              </div>
              <div className="attachment-details">
                <div>ID: {message.receipt.id}</div>
                <div>Business: {message.receipt.business}</div>
                <div>Amount: R{message.receipt.amount}</div>
              </div>
            </div>
          )}
          
          {message.payment && (
            <div className="message-attachment payment">
              <div className="attachment-header">
                <CreditCard size={16} />
                <span>Payment Processed</span>
              </div>
              <div className="attachment-details">
                <div>ID: {message.payment.id}</div>
                <div>To: {message.payment.to}</div>
                <div>Amount: R{message.payment.amount}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const commands = [
    {
      command: '+invoice recipient=Name;item=Item;qty=1;price=100',
      description: 'Generate an invoice'
    },
    {
      command: '+receipt business=Business;item=Item;amount=100;payment=Card',
      description: 'Generate a receipt'
    },
    {
      command: '+payment to=Recipient;amount=100;method=EFT',
      description: 'Process a payment'
    },
    {
      command: '+help',
      description: 'Show available commands'
    }
  ];

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat</h2>
        <div className="room-tabs">
          {rooms.map(room => (
            <button
              key={room.id}
              className={`room-tab ${room.active ? 'active' : ''}`}
              onClick={() => changeRoom(room.id)}
            >
              {room.name}
            </button>
          ))}
        </div>
        <button
          className="commands-toggle"
          onClick={() => setShowCommands(!showCommands)}
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {showCommands && (
        <div className="commands-panel">
          <h4>Available Commands</h4>
          <div className="commands-list">
            {commands.map((cmd, index) => (
              <div key={index} className="command-item">
                <div className="command-text">{cmd.command}</div>
                <div className="command-description">{cmd.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <MessageCircle size={48} />
            <h3>No messages yet</h3>
            <p>Start the conversation or use commands to generate invoices, receipts, and payments</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="input-wrapper">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message or use commands like +invoice, +receipt, +payment..."
            className="message-input"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="send-button"
          >
            <Send size={20} />
          </button>
        </div>
        
        <div className="input-hint">
          <HelpCircle size={14} />
          <span>Use +help to see available commands</span>
        </div>
      </div>
    </div>
  );
}

