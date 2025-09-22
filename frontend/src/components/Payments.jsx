import React, { useState, useEffect } from 'react';
import { CreditCard, Send, History, Plus, User, DollarSign, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Payments({ user }) {
  const [payments, setPayments] = useState([]);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPayment, setNewPayment] = useState({
    to: '',
    amount: '',
    method: 'EFT'
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      // In a real app, you'd fetch from the backend
      // For now, we'll simulate some data
      setPayments([
        {
          id: '1',
          from: user.id,
          to: 'John Doe',
          amount: 500,
          method: 'EFT',
          status: 'completed',
          timestamp: Date.now() - 1000 * 60 * 30
        },
        {
          id: '2',
          from: user.id,
          to: 'Sarah Smith',
          amount: 250,
          method: 'Card',
          status: 'completed',
          timestamp: Date.now() - 1000 * 60 * 60 * 2
        }
      ]);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPaymentChange = (e) => {
    setNewPayment({
      ...newPayment,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!newPayment.to || !newPayment.amount) {
      alert('Please fill in all fields');
      return;
    }

    const amount = parseFloat(newPayment.amount);
    if (amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    if (amount > user.balance) {
      alert('Insufficient balance');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newPayment)
      });

      const data = await response.json();

      if (response.ok) {
        // Add new payment to the list
        const payment = {
          id: data.payment.id,
          from: user.id,
          to: newPayment.to,
          amount: parseFloat(newPayment.amount),
          method: newPayment.method,
          status: 'completed',
          timestamp: Date.now()
        };
        
        setPayments(prev => [payment, ...prev]);
        
        // Reset form
        setNewPayment({ to: '', amount: '', method: 'EFT' });
        setShowNewPayment(false);
        
        // Update user balance (in a real app, this would come from the backend)
        // For now, we'll just show a success message
        alert('Payment processed successfully!');
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="payments-loading">
        <div className="loading-spinner"></div>
        <p>Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="payments-container">
      <div className="payments-header">
        <div className="header-content">
          <h2>Payments</h2>
          <p>Send money to friends, family, and businesses</p>
        </div>
        <button
          className="new-payment-button"
          onClick={() => setShowNewPayment(true)}
        >
          <Plus size={20} />
          New Payment
        </button>
      </div>

      <div className="payments-content">
        <div className="balance-card">
          <div className="balance-info">
            <div className="balance-label">Available Balance</div>
            <div className="balance-amount">R{user.balance?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="balance-icon">
            <CreditCard size={24} />
          </div>
        </div>

        {showNewPayment && (
          <div className="new-payment-form">
            <div className="form-header">
              <h3>Send Payment</h3>
              <button
                className="close-button"
                onClick={() => setShowNewPayment(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitPayment}>
              <div className="form-group">
                <label>Recipient</label>
                <div className="input-wrapper">
                  <User size={20} className="input-icon" />
                  <input
                    type="text"
                    name="to"
                    placeholder="Enter recipient name or email"
                    value={newPayment.to}
                    onChange={handleNewPaymentChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Amount (R)</label>
                <div className="input-wrapper">
                  <DollarSign size={20} className="input-icon" />
                  <input
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    value={newPayment.amount}
                    onChange={handleNewPaymentChange}
                    min="0.01"
                    step="0.01"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  name="method"
                  value={newPayment.method}
                  onChange={handleNewPaymentChange}
                  className="form-select"
                >
                  <option value="EFT">EFT</option>
                  <option value="Card">Card</option>
                  <option value="Wallet">Wallet</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowNewPayment(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={!newPayment.to || !newPayment.amount}
                >
                  <Send size={16} />
                  Send Payment
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="payments-list">
          <div className="section-header">
            <h3>Recent Payments</h3>
            <History size={20} />
          </div>
          
          {payments.length === 0 ? (
            <div className="no-payments">
              <CreditCard size={48} />
              <h3>No payments yet</h3>
              <p>Make your first payment to see it here</p>
            </div>
          ) : (
            <div className="payments-grid">
              {payments.map((payment) => (
                <div key={payment.id} className="payment-card">
                  <div className="payment-header">
                    <div className="payment-icon">
                      <CreditCard size={20} />
                    </div>
                    <div className={`payment-status ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </div>
                  </div>
                  
                  <div className="payment-details">
                    <div className="payment-amount">R{payment.amount.toFixed(2)}</div>
                    <div className="payment-recipient">To: {payment.to}</div>
                    <div className="payment-method">Method: {payment.method}</div>
                  </div>
                  
                  <div className="payment-time">
                    <Clock size={14} />
                    {formatTimestamp(payment.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

