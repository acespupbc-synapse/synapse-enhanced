import React from 'react';
import { LinkedinLogo, GithubLogo, FacebookLogo, Envelope } from '@phosphor-icons/react';
import './Footer.css';

export default function Footer({ className = '' }) {
  return (
    <footer className={`synapse-footer ${className}`.trim()}>
      <div className="synapse-footer-left">
        <span className="synapse-footer-brand">© 2026 ACES-PUPBC Synapse</span>
        <span className="synapse-footer-version">Enhanced</span>
        <span className="synapse-footer-sub">
          For campus use only. Compliant with Data Privacy Act of 2012 (RA 10173).
        </span>
      </div>

      <div className="synapse-footer-right">
        <div className="synapse-dev-credits">
          <a
            href="https://www.linkedin.com/in/jbhcontact/"
            target="_blank"
            rel="noopener noreferrer"
            className="synapse-icon-link"
            title="LinkedIn: JB Hernandez"
          >
            <LinkedinLogo size={16} weight="fill" />
          </a>
          <a
            href="https://github.com/JOBIJEEEB"
            target="_blank"
            rel="noopener noreferrer"
            className="synapse-icon-link"
            title="GitHub: JOBIJEEEB"
          >
            <GithubLogo size={16} weight="fill" />
          </a>
          <span>Developed by JB Hernandez</span>
        </div>

        <span className="synapse-footer-divider">|</span>

        <a
          href="mailto:acesorganization2022@gmail.com"
          className="synapse-footer-link"
          title="Email Support"
        >
          <Envelope size={14} weight="fill" />
          <span>Support</span>
        </a>

        <span className="synapse-footer-divider">|</span>

        <a
          href="https://www.facebook.com/acespupbc"
          target="_blank"
          rel="noopener noreferrer"
          className="synapse-footer-link"
          title="Facebook: ACES PUPBC"
        >
          <FacebookLogo size={14} weight="fill" />
          <span>Facebook</span>
        </a>
      </div>
    </footer>
  );
}
