import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageCircle, 
  CreditCard, 
  FileText, 
  Receipt, 
  LogOut,
  User,
  Wallet
} from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/invoices', icon: FileText, label: 'Invoices' },
    { path: '/receipts', icon: Receipt, label: 'Receipts' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🚀</span>
          <span className="logo-text">Super App</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-phone">{user.phoneNumber}</div>
            <div className="user-balance">
              <Wallet size={16} />
              R{user.balance?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
        
        <button className="logout-button" onClick={onLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
