import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Download, Eye, Clock } from 'lucide-react';

export default function Invoices({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      // In a real app, you'd fetch from the backend
      // For now, we'll simulate some data
      setInvoices([
        {
          id: 'INV001',
          createdBy: user.id,
          recipient: 'John Doe',
          line_items: [
            { description: 'Web Design Services', qty: 1, unit_price: 500, total: 500 }
          ],
          total: 500,
          status: 'pending',
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2
        },
        {
          id: 'INV002',
          createdBy: user.id,
          recipient: 'Sarah Smith',
          line_items: [
            { description: 'Consulting Hours', qty: 8, unit_price: 150, total: 1200 }
          ],
          total: 1200,
          status: 'paid',
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5
        },
        {
          id: 'INV003',
          createdBy: user.id,
          recipient: 'Mike Johnson',
          line_items: [
            { description: 'Software License', qty: 1, unit_price: 200, total: 200 },
            { description: 'Support Package', qty: 1, unit_price: 100, total: 100 }
          ],
          total: 300,
          status: 'overdue',
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10
        }
      ]);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getTotalInvoices = () => {
    return invoices.length;
  };

  const getTotalValue = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  };

  const getPaidInvoices = () => {
    return invoices.filter(invoice => invoice.status === 'paid').length;
  };

  const getPendingInvoices = () => {
    return invoices.filter(invoice => invoice.status === 'pending').length;
  };

  if (loading) {
    return (
      <div className="invoices-loading">
        <div className="loading-spinner"></div>
        <p>Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="invoices-container">
      <div className="invoices-header">
        <div className="header-content">
          <h2>Invoices</h2>
          <p>Manage your business invoices and payments</p>
        </div>
        <button className="new-invoice-button">
          <Plus size={20} />
          New Invoice
        </button>
      </div>

      <div className="invoices-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{getTotalInvoices()}</div>
            <div className="stat-label">Total Invoices</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">R{getTotalValue().toFixed(2)}</div>
            <div className="stat-label">Total Value</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{getPaidInvoices()}</div>
            <div className="stat-label">Paid</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{getPendingInvoices()}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      </div>

      <div className="invoices-controls">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <Filter size={20} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="invoices-list">
        {filteredInvoices.length === 0 ? (
          <div className="no-invoices">
            <FileText size={48} />
            <h3>No invoices found</h3>
            <p>Create your first invoice to get started</p>
          </div>
        ) : (
          <div className="invoices-grid">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="invoice-card">
                <div className="invoice-header">
                  <div className="invoice-id">{invoice.id}</div>
                  <div className={`invoice-status ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </div>
                </div>
                
                <div className="invoice-content">
                  <div className="invoice-recipient">
                    <strong>To:</strong> {invoice.recipient}
                  </div>
                  
                  <div className="invoice-items">
                    {invoice.line_items.map((item, index) => (
                      <div key={index} className="invoice-item">
                        <span className="item-description">{item.description}</span>
                        <span className="item-qty">x{item.qty}</span>
                        <span className="item-price">R{item.unit_price}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="invoice-total">
                    <strong>Total: R{invoice.total.toFixed(2)}</strong>
                  </div>
                </div>
                
                <div className="invoice-footer">
                  <div className="invoice-date">
                    Created: {formatTimestamp(invoice.createdAt)}
                  </div>
                  
                  <div className="invoice-actions">
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

