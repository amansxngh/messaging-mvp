import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import Payments from './components/Payments';
import Invoices from './components/Invoices';
import Receipts from './components/Receipts';
import Sidebar from './components/Sidebar';
import './styles.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verify token and get user data
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      const newSocket = io(SOCKET_URL, { 
        transports: ['websocket'],
        auth: { token }
      });
      setSocket(newSocket);

      return () => newSocket.disconnect();
    }
  }, [user, token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setSocket(null);
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Super App...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <div className="auth-container">
          <div className="auth-header">
            <h1>🚀 Messaging Super App</h1>
            <p>One app to simplify life and business</p>
          </div>
          <Routes>
            <Route path="/" element={<Signup onSignup={handleSignup} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard user={user} socket={socket} />} />
            <Route path="/chat" element={<Chat user={user} socket={socket} />} />
            <Route path="/payments" element={<Payments user={user} />} />
            <Route path="/invoices" element={<Invoices user={user} />} />
            <Route path="/receipts" element={<Receipts user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
