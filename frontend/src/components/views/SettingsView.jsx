import React from 'react';
import { Gear, ToggleLeft, ToggleRight, Database, Shield } from '@phosphor-icons/react';

export default function SettingsView({ stats, onToggleRegistration }) {
  return (
    <div className="main-workspace">
      <header className="dashboard-header">
        <div className="header-kicker">
          <span>SYSTEM CONFIGURATION</span>
        </div>
        <h1 className="header-title">System Settings &amp; Policies</h1>
        <p className="header-subtitle">
          Configure portal open/closed state, active academic year, and database maintenance.
        </p>
      </header>

      <div className="bento-grid">
        <div className="bento-card col-span-6">
          <div className="card-header-area">
            <div className="card-title-group">
              <span className="card-kicker">PORTAL AVAILABILITY</span>
              <h3 className="card-title">Registration Status Toggle</h3>
              <p className="card-desc">Control whether students can submit new registrations through the public wizard.</p>
            </div>
          </div>

          <div className="nested-preview-box" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: stats.isRegistrationOpen ? 'var(--color-green)' : '#EF4444' }}>
                {stats.isRegistrationOpen ? 'Registration is OPEN' : 'Registration is CLOSED'}
              </div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                {stats.isRegistrationOpen ? 'Incoming submissions accepted' : 'Public form displays closed notice'}
              </div>
            </div>

            <button
              onClick={onToggleRegistration}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              aria-label="Toggle registration state"
            >
              {stats.isRegistrationOpen ? (
                <ToggleRight size={38} weight="fill" color="var(--color-green)" />
              ) : (
                <ToggleLeft size={38} weight="fill" color="#EF4444" />
              )}
            </button>
          </div>
        </div>

        <div className="bento-card col-span-6">
          <div className="card-header-area">
            <div className="card-title-group">
              <span className="card-kicker">DATABASE ENGINE</span>
              <h3 className="card-title">SQLite Canonical Store</h3>
              <p className="card-desc">Local zero-maintenance relational database with Alembic migration versioning.</p>
            </div>
          </div>

          <div className="nested-preview-box" style={{ gap: 8, fontSize: 'var(--text-xs)' }}>
            <div><strong>Database File:</strong> <code>aces_synapse.db</code></div>
            <div><strong>Engine:</strong> SQLAlchemy 2.0.52 + SQLite 3</div>
            <div><strong>Migrations:</strong> Alembic Revision <code>1c4d9a92a543</code> (Head)</div>
            <div><strong>Address Model:</strong> Split Entities (PERM_* vs CTCT_*)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
