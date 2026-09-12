import React, { useState, useEffect } from 'react';
import {
  Cpu,
  ShieldCheck,
  User,
  CalendarBlank,
  Users,
  Trash,
  Database,
  Gear,
  IdentificationCard
} from '@phosphor-icons/react';
import './BentoGrid.css';

// ── Utility: format time and date ──────────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Person placeholder SVG (when no real photo available) ──────────────────
function PersonAvatar({ size = 50 }) {
  return (
    <div
      className="feed-avatar-placeholder"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <IdentificationCard size={size * 0.55} weight="duotone" />
    </div>
  );
}

export default function BentoGrid({ stats, onToggleRegistration }) {
  // ── Live Clock ────────────────────────────────────────────────────────────
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const time = formatTime(now);
  const date = formatDate(now);

  // ── Dashboard Data (realistic placeholders ready for backend) ─────────────
  const cpu = '23%';
  const apiHealth = '43 ms';
  const liveUsers = '10';
  const academicYear = stats?.ayName?.replace('AY ', '') ?? '2026-2027';
  const registrationOpen = stats?.isRegistrationOpen ?? true;

  const totalRegistered = stats?.enrolledCount ?? 307;
  const recycleBinCount = '02';

  const topPrograms = [
    { name: 'BSBA-HRM', count: 123, max: 150 },
    { name: 'BSIT', count: 87, max: 150 },
    { name: 'BSCpE', count: 78, max: 150 },
    { name: 'BSIE', count: 70, max: 150 },
  ];

  const liveFeed = [
    { name: 'John Benedict G. Hernandez', section: 'BSCPE 1-2 | 2022-00218-BN-0', time: '1 min ago' },
    { name: 'Maria Nicole T. Santos', section: 'BSIT 2-1 | 2023-00102-BN-0', time: '3 min ago' },
    { name: 'Christian G. Fernandez', section: 'BSBA-HRM 1-1 | 2024-00416-BN-0', time: '4 min ago' },
    { name: 'Rica Joy B. Dela Cruz', section: 'BSIE 3-1 | 2022-00055-BN-0', time: '5 min ago' },
    { name: 'Mark Andrei P. Reyes', section: 'DCpET 2-2 | 2023-00310-BN-0', time: '7 min ago' },
  ];

  const programRegistrations = [
    {
      code: 'ACES',
      logo: '/img/orgs/aces.png',
      header: '/img/orgs/aces_header.png',
      sections: [
        { name: 'BSCpE', count: 134 },
        { name: 'DCpET', count: 62 },
      ],
    },
    {
      code: 'IBITS',
      logo: '/img/orgs/ibits.png',
      header: '/img/orgs/ibits_header.png',
      sections: [
        { name: 'BSIT', count: 156 },
        { name: 'DIT', count: 48 },
      ],
    },
    {
      code: 'PIIE',
      logo: '/img/orgs/piie.png',
      header: '/img/orgs/piie_header.png',
      sections: [
        { name: 'BSIE', count: 95 },
      ],
    },
    {
      code: 'HRSS',
      logo: '/img/orgs/hrss.png',
      header: '/img/orgs/hrss_header.png',
      sections: [
        { name: 'BSBA-HRM', count: 123 },
      ],
    },
    {
      code: 'SMS',
      logo: '/img/orgs/sms.png',
      header: '/img/orgs/sms_header.png',
      sections: [
        { name: 'BSPSY', count: 110 },
      ],
    },
    {
      code: 'YES',
      logo: '/img/orgs/yes.png',
      header: '/img/orgs/yes_header.png',
      sections: [
        { name: 'BSED-ENG', count: 85 },
        { name: 'BSED-SS', count: 76 },
        { name: 'BEED', count: 92 },
      ],
    },
  ];

  return (
    <main className="dashboard-main" role="main">
      <h1 className="dashboard-page-title">Dashboard</h1>

      {/* ── Header Metric Row ──────────────────────────────────────────────── */}
      <div className="dashboard-header-row">

        {/* Clock & System Card */}
        <div className="metric-card clock-system-card">
          <div className="clock-section">
            <h2 className="clock-time">{time}</h2>
            <p className="clock-date">{date}</p>
          </div>
          <div className="clock-divider" />
          <div className="system-section">
            <div className="sys-stat">
              <Cpu size={15} weight="fill" />
              <span>CPU:</span>
              <strong>{cpu}</strong>
            </div>
            <div className="sys-stat">
              <ShieldCheck size={15} weight="fill" />
              <span>API Health:</span>
              <strong>{apiHealth}</strong>
            </div>
          </div>
        </div>

        {/* Live Users Card */}
        <div className="metric-card small-metric-card">
          <span className="metric-label">Live Users:</span>
          <div className="metric-value-row">
            <User size={26} weight="fill" />
            <span className="metric-big-num">{liveUsers}</span>
          </div>
        </div>

        {/* Academic Year Card */}
        <div className="metric-card small-metric-card">
          <span className="metric-label">Academic Year:</span>
          <div className="metric-value-row">
            <CalendarBlank size={26} weight="fill" />
            <span className="metric-big-num">{academicYear}</span>
          </div>
        </div>

        {/* Registration Toggle Card */}
        <div className="metric-card toggle-metric-card">
          <span className="metric-label">Registration:</span>
          <div className="toggle-switch-container">
            <button
              className={`custom-toggle ${registrationOpen ? 'open' : 'closed'}`}
              onClick={onToggleRegistration}
              aria-label={registrationOpen ? 'Close registration' : 'Open registration'}
            >
              <span className="toggle-text">{registrationOpen ? 'OPEN' : 'CLOSED'}</span>
              <div className="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div className="dashboard-grid">

        {/* LEFT COLUMN */}
        <div className="grid-col grid-col-left">

          {/* Total Registered */}
          <div className="panel-card total-registered-card">
            <div className="total-reg-content">
              <div className="total-reg-icon">
                <Users size={30} weight="fill" />
              </div>
              <div className="total-reg-text">
                <span className="panel-label">Total registered:</span>
                <span className="total-reg-num">{totalRegistered}</span>
              </div>
            </div>
            <button className="recycle-bin-row action-btn-hover">
              <div className="recycle-left">
                <Trash size={14} weight="fill" />
                <span>Recycle Bin:</span>
              </div>
              <span className="recycle-count">{recycleBinCount}</span>
            </button>
          </div>

          {/* Top 4 Programs */}
          <div className="panel-card top-programs-card">
            <h3 className="panel-title">Top Programs:</h3>
            <div className="programs-bar-list">
              {topPrograms.map((prog) => (
                <div className="prog-bar-item" key={prog.name}>
                  <span className="prog-name">{prog.name}</span>
                  <div className="prog-bar-track">
                    <div
                      className="prog-bar-fill"
                      style={{ width: `${(prog.count / prog.max) * 100}%` }}
                    />
                  </div>
                  <span className="prog-count">{prog.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Database Capacity */}
          <div className="panel-card supabase-card">
            <span className="panel-label">Database Capacity:</span>
            <div className="supabase-content">
              <div className="supa-icon-group">
                <Database size={44} weight="fill" color="#FFFFFF" />
                <Gear size={18} weight="fill" className="supa-gear" />
              </div>
              <div className="supa-stats">
                <span className="supa-percent">40%</span>
                <div className="supa-bar-discrete">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className={`discrete-line ${i < 8 ? 'active' : ''}`} />
                  ))}
                </div>
                <span className="supa-volume">220 MB / 500 MB</span>
              </div>
            </div>
          </div>

        </div>

        {/* CENTER COLUMN */}
        <div className="grid-col grid-col-center">
          <div className="panel-card feed-card">
            <h3 className="panel-title">Live Registration Feed:</h3>
            <div className="feed-list-scroll">
              <div className="feed-list">
                {liveFeed.map((item, idx) => (
                  <div className="feed-item" key={idx}>
                    <PersonAvatar size={48} />
                    <div className="feed-info">
                      <h4 className="feed-name">{item.name}</h4>
                      <p className="feed-section">{item.section}</p>
                      <p className="feed-time">Registered <strong>{item.time}</strong></p>
                      <button className="btn-view-edit">View / Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="grid-col grid-col-right">
          <div className="panel-card program-regs-card">
            <h3 className="panel-title">Total Registrations By Program:</h3>
            <div className="program-cards-list-scroll">
              <div className="program-cards-list">
                {programRegistrations.map((prog) => (
                  <button
                    className="prog-banner-card action-btn-hover"
                    key={prog.code}
                    style={{ backgroundImage: `url(${prog.header})` }}
                  >
                    <div className="prog-banner-overlay" />
                    <img src={prog.logo} alt={prog.code} className="prog-banner-logo" />
                    <div className="prog-sections-wrap">
                      <div className="prog-sections-row">
                        {prog.sections.slice(0, 2).map((sec, idx) => (
                          <div className="prog-section-pill" key={idx}>
                            <span className="sec-name">{sec.name}</span>
                            <span className="sec-count-box">
                              <Users size={11} weight="fill" /> {sec.count}
                            </span>
                          </div>
                        ))}
                      </div>
                      {prog.sections.length > 2 && (
                        <div className="prog-sections-row">
                          {prog.sections.slice(2, 4).map((sec, idx) => (
                            <div className="prog-section-pill" key={idx}>
                              <span className="sec-name">{sec.name}</span>
                              <span className="sec-count-box">
                                <Users size={11} weight="fill" /> {sec.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Dashboard Footer Bar ────────────────────────────────────────────── */}
      <footer className="dashboard-footer">
        <div className="dashboard-footer-left">
          <span className="dashboard-footer-brand">© 2026 ACES-PUPBC Synapse</span>
          <span className="version-badge-sm">Enhanced v1.0</span>
          <span className="dashboard-footer-sub">
            For campus use only. Compliant with Data Privacy Act of 2012 (RA 10173).
          </span>
        </div>
        <div className="dashboard-footer-right">
          <a href="#" className="dashboard-footer-link">Developed by JB Hernandez</a>
          <span className="dashboard-footer-divider">|</span>
          <a href="#" className="dashboard-footer-link">Support</a>
          <span className="dashboard-footer-divider">|</span>
          <a href="#" className="dashboard-footer-link">Facebook</a>
        </div>
      </footer>
    </main>
  );
}
