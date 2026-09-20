import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LockKey, User, WarningCircle, ArrowClockwise } from '@phosphor-icons/react';
import { authApi } from '../../services/api';
import './LoginView.css';

export default function LoginView({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.login(username.trim(), password);
      setIsLoading(false);
      if (onLogin) {
        onLogin(result.user || { username });
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Invalid username or password.');
    }
  };

  return (
    <div className="login-view-container">
      <div className="login-card login-auth-card">
        <div className="login-modal-header">
          <div className="login-modal-icon">
            <img
                src="/img/logo/loadingmodal_logo.png"
                alt="ACES Synapse Logo"
                className="home-synapse-logo"
              />
          </div>
          <h2 className="login-modal-title">Admin Login</h2>
          <p className="login-modal-subtitle">
            Enter your admin credentials to access the dashboard.
          </p>
        </div>

        <form onSubmit={handleAdminSubmit} className="login-modal-form">
          {errorMsg && (
            <div className="login-modal-alert">
              <WarningCircle size={16} weight="bold" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="login-modal-field">
            <label>Username</label>
            <div className="login-input-wrap">
              <User size={16} className="login-field-icon" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoFocus
              />
            </div>
          </div>

          <div className="login-modal-field">
            <label>Password</label>
            <div className="login-input-wrap">
              <LockKey size={16} className="login-field-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
          </div>

          <div className="login-modal-actions">
            <button
              type="button"
              className="btn-secondary-dark"
              style={{ padding: '10px 18px', fontSize: '0.85rem' }}
              onClick={() => navigate('/home')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-red"
              style={{ padding: '10px 24px', fontSize: '0.85rem' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowClockwise size={16} className="spin" /> Verifying…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="login-card-footer" style={{ marginTop: 24 }}>
          ASSOCIATION OF COMPUTER ENGINEERING STUDENTS - PUPBC
        </div>
      </div>
    </div>
  );
}
