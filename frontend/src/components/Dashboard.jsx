import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  CreditCard, 
  FileText, 
  Receipt, 
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Dashboard({ user, socket }) {
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalPayments: 0,
    totalInvoices: 0,
    totalReceipts: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('message', (message) => {
        setRecentActivity(prev => [message, ...prev.slice(0, 9)]);
        updateStats(message);
      });
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      // In a real app, you'd fetch these from the backend
      // For now, we'll simulate some data
      setStats({
        totalMessages: 42,
        totalPayments: 8,
        totalInvoices: 15,
        totalReceipts: 23
      });
      
      setRecentActivity([
        {
          id: '1',
          type: 'message',
          user: 'John Doe',
          text: 'Thanks for the invoice!',
          timestamp: Date.now() - 1000 * 60 * 5
        },
        {
          id: '2',
          type: 'payment',
          user: 'SYSTEM',
          text: 'Payment processed: R500 to Sarah',
          timestamp: Date.now() - 1000 * 60 * 15
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (message) => {
    if (message.type === 'message') {
      setStats(prev => ({ ...prev, totalMessages: prev.totalMessages + 1 }));
    } else if (message.type === 'payment') {
      setStats(prev => ({ ...prev, totalPayments: prev.totalPayments + 1 }));
    } else if (message.type === 'invoice') {
      setStats(prev => ({ ...prev, totalInvoices: prev.totalInvoices + 1 }));
    } else if (message.type === 'receipt') {
      setStats(prev => ({ ...prev, totalReceipts: prev.totalReceipts + 1 }));
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user.name}! 👋</h1>
        <p>Here's what's happening in your Super App today</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <MessageCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalMessages}</div>
            <div className="stat-label">Messages</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalPayments}</div>
            <div className="stat-label">Payments</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalInvoices}</div>
            <div className="stat-label">Invoices</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Receipt size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalReceipts}</div>
            <div className="stat-label">Receipts</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="balance-section">
          <div className="balance-card">
            <div className="balance-header">
              <h3>Account Balance</h3>
              <TrendingUp size={20} className="trend-icon" />
            </div>
            <div className="balance-amount">R{user.balance?.toFixed(2) || '0.00'}</div>
            <div className="balance-label">Available for payments and transfers</div>
          </div>
        </div>

        <div className="recent-activity">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <Activity size={20} />
          </div>
          
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'message' && <MessageCircle size={16} />}
                    {activity.type === 'payment' && <CreditCard size={16} />}
                    {activity.type === 'invoice' && <FileText size={16} />}
                    {activity.type === 'receipt' && <Receipt size={16} />}
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>{activity.user}</strong>: {activity.text}
                    </div>
                    <div className="activity-time">
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activity">
                <p>No recent activity</p>
                <p>Start chatting or make a payment to see activity here</p>
              </div>
            )}
          </div>
        </div>

        <div className="quick-actions">
          <div className="section-header">
            <h3>Quick Actions</h3>
          </div>
          
          <div className="actions-grid">
            <button className="action-button">
              <MessageCircle size={20} />
              <span>New Chat</span>
            </button>
            <button className="action-button">
              <CreditCard size={20} />
              <span>Send Payment</span>
            </button>
            <button className="action-button">
              <FileText size={20} />
              <span>Create Invoice</span>
            </button>
            <button className="action-button">
              <Receipt size={20} />
              <span>Generate Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

