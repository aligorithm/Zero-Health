import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import logo from '../assets/logo-light-bg.svg';
import { buildApiUrl } from '../config/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    code: searchParams.get('code') || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState(searchParams.get('message') || '');
  const [error, setError] = useState(searchParams.get('error') || '');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 3) {
      setError('Password must be at least 3 characters');
      return;
    }

    try {
      const response = await fetch(buildApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successfully! You can now log in with your new password.');
        setFormData({ ...formData, newPassword: '', confirmPassword: '' });
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <img src={logo} alt="Zero Health Logo" className="auth-logo-image" />
        </div>
        <h2>Reset Your Password</h2>
        <p className="subtitle">Enter your new password below</p>
        
        {/* XSS Vulnerability - code parameter displayed without sanitization */}
        {formData.code && (
          <div className="code-display">
            <small style={{ color: '#666' }}>
              Reset Code: <span dangerouslySetInnerHTML={{ __html: formData.code }} />
            </small>
          </div>
        )}

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="code">Reset Code</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              readOnly
            />
            <small style={{ color: '#666' }}>This code was provided in your password reset email</small>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter your new password"
              required
              minLength="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your new password"
              required
              minLength="3"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Reset Password
          </button>
        </form>

        <div className="auth-links">
          <p>
            <button
              onClick={() => window.location.href = '/login'}
              className="link-button"
            >
              ← Back to Login
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 2rem;
        }

        .auth-box {
          background: white;
          padding: 2.5rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 500px;
        }

        .auth-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .auth-logo-image {
          height: 60px;
          width: auto;
        }

        h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .subtitle {
          color: #6b7280;
          text-align: center;
          margin-bottom: 1rem;
        }

        .code-display {
          text-align: center;
          margin-bottom: 2rem;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 0.5rem;
        }

        .success-message {
          background: #d1fae5;
          color: #065f46;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .error-message {
          background: #fee2e2;
          color: #ef4444;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        label {
          font-weight: 500;
          color: #4b5563;
        }

        input {
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        input:focus {
          outline: none;
          border-color: #2563eb;
        }

        input[readonly] {
          background-color: #f9fafb;
          color: #6b7280;
        }

        .btn {
          padding: 0.75rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
        }

        .auth-links {
          margin-top: 1.5rem;
          text-align: center;
          color: #6b7280;
        }

        .link-button {
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          font-size: 1rem;
        }

        .link-button:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default ResetPassword; 