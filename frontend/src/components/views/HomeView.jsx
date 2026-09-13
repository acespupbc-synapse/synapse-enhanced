import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../common/Footer';
import './LoginView.css';
import './HomeView.css';

export default function HomeView() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-center">
        <div className="login-card home-card">
          <div className="login-header">
            <div className="home-logo-group">
              <img
                src="/img/logo/aces-synapse-red.png"
                alt="ACES Synapse Logo"
                className="home-synapse-logo"
              />
              <img
                src="/img/logo/aces_synapse_text.png"
                alt="ACES Synapse"
                className="home-synapse-text-img"
              />
            </div>
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
            ASSOCIATION OF COMPUTER ENGINEERING STUDENTS - PUPBC
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
