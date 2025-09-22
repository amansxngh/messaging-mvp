import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Filter, Download, Eye, Calendar } from 'lucide-react';

export default function Receipts({ user }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      // In a real app, you'd fetch from the backend
      // For now, we'll simulate some data
      setReceipts([
        {
          id: 'RCP001',
          createdBy: user.id,
          business: 'Coffee Shop',
          item: 'Cappuccino & Pastry',
          amount: 45.50,
          paymentMethod: 'Card',
          timestamp: Date.now() - 1000 * 60 * 60 * 2
        },
        {
          id: 'RCP002',
          createdBy: user.id,
          business: 'Grocery Store',
          item: 'Weekly Groceries',
          amount: 320.75,
          paymentMethod: 'EFT',
          timestamp: Date.now() - 1000 * 60 * 60 * 24
        },
        {
          id: 'RCP003',
          createdBy: user.id,
          business: 'Gas Station',
          item: 'Fuel',
          amount: 180.00,
          paymentMethod: 'Card',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2
        },
        {
          id: 'RCP004',
          createdBy: user.id,
          business: 'Restaurant',
          item: 'Dinner for Two',
          amount: 95.80,
          paymentMethod: 'Card',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3
        }
      ]);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.business.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPaymentMethod = paymentMethodFilter === 'all' || receipt.paymentMethod === paymentMethodFilter;
    
    return matchesSearch && matchesPaymentMethod;
  });

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getTotalReceipts = () => {
    return receipts.length;
  };

  const getTotalSpent = () => {
    return receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  };

  const getCardPayments = () => {
    return receipts.filter(receipt => receipt.paymentMethod === 'Card').length;
  };

  const getEFTPayments = () => {
    return receipts.filter(receipt => receipt.paymentMethod === 'EFT').length;
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'Card':
        return 'primary';
      case 'EFT':
        return 'success';
      case 'Cash':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="receipts-loading">
        <div className="loading-spinner"></div>
        <p>Loading receipts...</p>
      </div>
    );
  }

  return (
    <div className="receipts-container">
      <div className="receipts-header">
        <div className="header-content">
          <h2>Receipts</h2>
          <p>Track your spending and payment history</p>
        </div>
        <button className="new-receipt-button">
          <Plus size={20} />
          New Receipt
        </button>
      </div>

      <div className="receipts-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Receipt size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{getTotalReceipts()}</div>
            <div className="stat-label">Total Receipts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">R{getTotalSpent().toFixed(2)}</div>
            <div className="stat-label">Total Spent</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Receipt size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{getCardPayments()}</div>
            <div className="stat-label">Card Payments</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{getEFTPayments()}</div>
            <div className="stat-label">EFT Payments</div>
          </div>
        </div>
      </div>

      <div className="receipts-controls">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search receipts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <Filter size={20} />
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Methods</option>
            <option value="Card">Card</option>
            <option value="EFT">EFT</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
      </div>

      <div className="receipts-list">
        {filteredReceipts.length === 0 ? (
          <div className="no-receipts">
            <Receipt size={48} />
            <h3>No receipts found</h3>
            <p>Create your first receipt to get started</p>
          </div>
        ) : (
          <div className="receipts-grid">
            {filteredReceipts.map((receipt) => (
              <div key={receipt.id} className="receipt-card">
                <div className="receipt-header">
                  <div className="receipt-id">{receipt.id}</div>
                  <div className={`receipt-payment-method ${getPaymentMethodColor(receipt.paymentMethod)}`}>
                    {receipt.paymentMethod}
                  </div>
                </div>
                
                <div className="receipt-content">
                  <div className="receipt-business">
                    <strong>Business:</strong> {receipt.business}
                  </div>
                  
                  <div className="receipt-item">
                    <strong>Item:</strong> {receipt.item}
                  </div>
                  
                  <div className="receipt-amount">
                    <strong>Amount: R{receipt.amount.toFixed(2)}</strong>
                  </div>
                </div>
                
                <div className="receipt-footer">
                  <div className="receipt-date">
                    Date: {formatTimestamp(receipt.timestamp)}
                  </div>
                  
                  <div className="receipt-actions">
                    <button className="action-button" title="View">
                      <Eye size={16} />
                    </button>
                    <button className="action-button" title="Download">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

