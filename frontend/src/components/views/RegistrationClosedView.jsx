import React from 'react';
import {
  ChatCircleDots,
  EnvelopeSimple,
  Info,
  ArrowLeft
} from '@phosphor-icons/react';
import './RegistrationClosedView.css';

export default function RegistrationClosedView({ academicYear = '2025-2026', onBack }) {
  const displayAY = academicYear.replace(/^AY\s*/i, '');
  const adminEmail = 'acesorganization2022@gmail.com';

  return (
    <div className="reg-closed-page">
      {/* Background ambient lighting */}
      <div className="reg-closed-glow top-left" />
      <div className="reg-closed-glow bottom-right" />
      <div className="reg-closed-grid-overlay" />

      {/* Main Container Card */}
      <div className="reg-closed-card">
        {/* ACES Logo with red backlight glow */}
        <div className="reg-closed-logo-wrap">
          <div className="reg-closed-logo-glow" />
          <img
            src="/img/orgs/aces.png"
            alt="ACES Logo"
            className="reg-closed-logo"
          />
        </div>

        {/* Heading */}
        <h1 className="reg-closed-title">REGISTRATION CLOSED</h1>
        <p className="reg-closed-subtitle">
          The ID processing period for AY {displayAY} has officially ended.
        </p>

        {/* Need Help Box */}
        <div className="reg-closed-help-box">
          <div className="reg-closed-help-icon">
            <Info size={20} weight="fill" color="#EF4444" />
          </div>
          <div className="reg-closed-help-content">
            <span className="reg-closed-help-tag">NEED HELP?</span>
            <p className="reg-closed-help-desc">
              For late registration requests, corrections, or other concerns regarding your student ID,
              please contact the ACES officers directly via our official page.
            </p>
          </div>
        </div>

        {/* Action Buttons (Red, White, Black, Gray — No Yellow) */}
        <div className="reg-closed-actions">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="reg-closed-btn-primary"
          >
            <ChatCircleDots size={20} weight="fill" />
            <span>Chat on Facebook</span>
          </a>

          <a
            href={`mailto:${adminEmail}?subject=Student%20ID%20Registration%20Inquiry%20(AY%20${displayAY})`}
            className="reg-closed-btn-secondary"
          >
            <EnvelopeSimple size={20} weight="bold" />
            <span>Email Us</span>
          </a>
        </div>

        {/* Back to Home Link */}
        {onBack && (
          <button
            type="button"
            className="reg-closed-back-btn"
            onClick={onBack}
          >
            <ArrowLeft size={16} />
            <span>Return to Home</span>
          </button>
        )}
      </div>
    </div>
  );
}
