import React, { useState } from 'react';
import { Phone, User, MessageSquare, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Signup({ onSignup }) {
  const [step, setStep] = useState(1); // 1: phone & name, 2: verification code
  const [formData, setFormData] = useState({
    phoneNumber: '',
    name: '',
    verificationCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [demoCode, setDemoCode] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (!formData.phoneNumber || !formData.name) {
      setError('Please fill in all fields');
      return;
    }

    // Basic phone number validation
    if (formData.phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        setDemoCode(data.demoCode);
        setStep(2);
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!formData.verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          name: formData.name,
          verificationCode: formData.verificationCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        onSignup(data.user, data.token);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep(1);
    setError('');
    setSuccessMessage('');
    setDemoCode('');
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        {step === 1 ? (
          <>
            <h2>Get Started</h2>
            <p className="auth-subtitle">Enter your phone number to continue</p>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSendCode}>
              <div className="form-group">
                <div className="input-wrapper">
                  <Phone className="input-icon" size={20} />
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Phone number"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-wrapper">
                  <User className="input-icon" size={20} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2>Verify Your Number</h2>
            <p className="auth-subtitle">Enter the code sent to {formData.phoneNumber}</p>
            
            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}

            {demoCode && (
              <div className="demo-code">
                <p><strong>Demo Code:</strong> {demoCode}</p>
                <p className="demo-note">In production, this would be sent via SMS</p>
              </div>
            )}
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyCode}>
              <div className="form-group">
                <div className="input-wrapper">
                  <MessageSquare className="input-icon" size={20} />
                  <input
                    type="text"
                    name="verificationCode"
                    placeholder="Enter 6-digit code"
                    value={formData.verificationCode}
                    onChange={handleChange}
                    maxLength="6"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>

            <div className="auth-footer">
              <button
                type="button"
                className="back-button"
                onClick={goBack}
              >
                ← Back to phone number
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

