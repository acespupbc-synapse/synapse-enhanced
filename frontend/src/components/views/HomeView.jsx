import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../common/Footer';
import './LoginView.css';

export default function HomeView() {
  const navigate = useNavigate();

  return (
    <div className="login-view-container">
      <div className="login-card home-card">
        <div className="login-header">
          <div className="home-logo-wrap">
            <img
              src="/img/logo/aces-synapse-red.png"
              alt="ACES Synapse Logo"
              className="home-synapse-logo"
            />
          </div>
          <h1 className="home-brand-title">
            ACES SYNAPSE
          </h1>
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

      <div className="home-footer-wrapper">
        <Footer />
      </div>
    </div>
  );
}
