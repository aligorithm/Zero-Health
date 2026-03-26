import React, { useState } from 'react';
import logo from '../assets/logo-light-bg.svg';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Deliberately vulnerable: No input sanitization
      const response = await fetch(buildApiUrl('/api/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Deliberately vulnerable: Storing JWT token in localStorage
        localStorage.setItem('user', JSON.stringify(data));
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Login failed');
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
        <h2>Welcome Back!</h2>
        <p className="subtitle">Login to access your medical records</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Email</label>
            <input
              type="text" // Deliberately vulnerable: Should be type="email"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="text" // Deliberately vulnerable: Should be type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>

        <div className="auth-links">
          <p>
            Don't have an account?{' '}
            <button
              onClick={() => window.location.href = '/register'}
              className="link-button"
            >
              Register here
            </button>
          </p>
          <p>
            <button
              onClick={() => window.location.href = '/forgot-password'}
              className="link-button"
            >
              Forgot Password?
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
          max-width: 400px;
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

export default Login; 