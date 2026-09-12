import React, { useState } from 'react';
import { ShieldCheck, LockKey, User, WarningCircle, ArrowClockwise, X } from '@phosphor-icons/react';
import { authApi } from '../../services/api';
import './LoginView.css';

export default function LoginView({ onLogin, onRegister }) {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [username, setUsername] = useState('admin');
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
      setShowAdminModal(false);
      if (onLogin) {
        onLogin(result.user || { username });
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Authentication failed. Check credentials.');
    }
  };

  return (
    <div className="login-view-container">
      <div className="login-card">
        <div className="login-header">
          <h1>
            <span className="brand-white">ACES</span> <span className="brand-red">Synapse</span>
          </h1>
          <p className="subtitle">
            The Official Student ID Processing System of the Association of Computer
            Engineering Students - PUPBC
          </p>
        </div>

        <div className="login-actions">
          <button className="btn-primary-red" onClick={onRegister}>
            Student Registration
          </button>
          <button className="btn-secondary-dark" onClick={() => setShowAdminModal(true)}>
            Admin Login
          </button>
        </div>

        <div className="login-card-footer">
          ACES-PUPBC STUDENT INFORMATION SYSTEM
        </div>
      </div>

      <div className="login-global-footer">
        <div className="footer-left">
          <div className="footer-brand-container">
            <span className="footer-brand">© 2026 ACES-PUPBC Synapse</span>
            <span className="version-badge">v2.1.2</span>
          </div>
          <span className="footer-sub">For campus use only · Student ID Processing System</span>
        </div>

        <div className="footer-right">
          <a href="#">Developed by JB Hernandez</a>
          <span className="divider">|</span>
          <a href="#">Support</a>
          <span className="divider">|</span>
          <a href="#">Facebook</a>
        </div>
      </div>

      {/* ACES logo — naturally below footer bar in document flow */}
      <div className="footer-logo">
        <img src="/img/orgs/aces.png" alt="ACES Logo" className="aces-logo" />
      </div>

      {/* Admin Login Modal Dialog */}
      {showAdminModal && (
        <div className="login-modal-backdrop" role="dialog" aria-modal="true">
          <div className="login-modal-dialog">
            <button
              type="button"
              className="login-modal-close"
              onClick={() => setShowAdminModal(false)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="login-modal-header">
              <div className="login-modal-icon">
                <ShieldCheck size={28} weight="fill" color="#E00000" />
              </div>
              <h2 className="login-modal-title">Admin Authentication</h2>
              <p className="login-modal-subtitle">
                Enter your administrative credentials to access the management dashboard.
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
                  onClick={() => setShowAdminModal(false)}
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
          </div>
        </div>
      )}
    </div>
  );
}
