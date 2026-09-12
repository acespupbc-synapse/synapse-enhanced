import React from 'react';
import './LoginView.css';

export default function LoginView({ onLogin, onRegister }) {
  return (
    <div className="login-view-container">
      <div className="login-card">
        <div className="login-header">
          <h1>
            <span className="brand-white">ACES</span> <span className="brand-amber">Synapse</span>
          </h1>
          <p className="subtitle">
            The Official Student ID Processing System of the Association of Computer
            Engineering Students - PUPBC
          </p>
        </div>

        <div className="login-actions">
          <button className="btn-primary-amber" onClick={onRegister}>
            Student Registration
          </button>
          <button className="btn-secondary-dark" onClick={onLogin}>
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
    </div>
  );
}
