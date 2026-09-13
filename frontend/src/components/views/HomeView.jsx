import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginView.css';

export default function HomeView() {
  const navigate = useNavigate();

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
          <button className="btn-primary-red" onClick={() => navigate('/register')}>
            Student Registration
          </button>
          <button
            className="btn-secondary-dark"
            onClick={() => navigate('/login')}
          >
            Admin Login
          </button>
        </div>

        <div className="login-card-footer">
          ACES-PUPBC STUDENT INFORMATION SYSTEM
        </div>
      </div>
    </div>
  );
}
