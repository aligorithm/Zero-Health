import React, { useState } from 'react';
import logo from '../assets/logo-light-bg.svg';
import { buildApiUrl, API_BASE_URL } from '../config/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailPreview, setEmailPreview] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      const response = await fetch(buildApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message + (data.emailGenerated ? ' Check the email preview below for testing.' : ''));
        if (data.emailGenerated) {
          setEmailPreview({
            emailPreviewUrl: data.emailPreviewUrl,
            recoveryUrl: data.recoveryUrl
          });
        }
      } else {
        setError(data.error || 'Failed to send reset email');
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
        <h2>Forgot Your Password?</h2>
        <p className="subtitle">Enter your email address and we'll send you a reset link</p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Send Reset Link
          </button>
        </form>

        {emailPreview && (
          <div className="email-preview">
            <h4>📧 Email Preview (Development Mode)</h4>
            <p>In a real application, this would be sent to your email. For testing purposes, you can view the email here:</p>
            <a href={`${API_BASE_URL}${emailPreview.emailPreviewUrl}`} target="_blank" rel="noopener noreferrer" className="preview-link">
              View Password Reset Email
            </a>
            <br /><br />
            <p><strong>Direct Reset Link:</strong></p>
            <a href={emailPreview.recoveryUrl} className="preview-link">
              Reset Password Now
            </a>
          </div>
        )}

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
          margin-bottom: 2rem;
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

        .email-preview {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }

        .email-preview h4 {
          margin-top: 0;
          color: #495057;
        }

        .preview-link {
          color: #2563eb;
          text-decoration: none;
          word-break: break-all;
        }

        .preview-link:hover {
          text-decoration: underline;
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

export default ForgotPassword; 