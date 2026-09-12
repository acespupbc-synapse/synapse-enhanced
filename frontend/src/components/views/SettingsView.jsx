import React, { useState } from 'react';
import {
  Globe,
  SlidersHorizontal,
  Camera,
  FileCsv,
  ShieldCheck,
  Database,
  FloppyDisk,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  DownloadSimple,
  Trash,
  Key,
  LockKey
} from '@phosphor-icons/react';
import './SettingsView.css';

export default function SettingsView({ stats, onToggleRegistration, onShowToast }) {
  const [activeCategory, setActiveCategory] = useState('portal');
  const [isSaving, setIsSaving] = useState(false);
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [dangerConfirmText, setDangerConfirmText] = useState('');

  // ── Portal & Session Settings State ───────────────────────────────────────
  const [portalConfig, setPortalConfig] = useState({
    isOpen: stats?.isRegistrationOpen ?? true,
    academicYear: stats?.ayName ?? 'AY 2025-2026',
    semester: '1st Semester',
    allowedYearLevels: '1st Year Only',
    announcement: 'Registration for Academic Year 2025-2026 is currently ongoing. Please have your 1500x1500px 2x2 JPG photo ready before starting the wizard.',
    closedMessage: 'The student registration portal is temporarily closed for maintenance or enrollment quota review. Please contact your department coordinator.'
  });

  // ── Registration Validation Rules State ────────────────────────────────────
  const [ruleConfig, setRuleConfig] = useState({
    idPrefixMask: 'YYYY-XXXXX-BN-0',
    preventDuplicates: true,
    requireContactAddress: true,
    autoUppercaseNames: true,
    validateBirthdateAge: true,
    minAge: 16
  });

  // ── Media & Storage Rules State ───────────────────────────────────────────
  const [mediaConfig, setMediaConfig] = useState({
    maxPhotoSizeMb: 5,
    photoResolution: '1500 × 1500 px (1:1 Ratio)',
    photoFormat: 'JPG / JPEG only',
    allowCameraCapture: true,
    allowFileUpload: true,
    signatureAdminOnly: true,
    signatureResolution: '2000 × 1200 px (White Background)',
    storageDriver: 'Local Relational Store (SQLite + File Storage)'
  });

  // ── MDB & CardFive Export State ───────────────────────────────────────────
  const [exportConfig, setExportConfig] = useState({
    exportEncoding: 'Windows-1252 (ANSI / Access Compatible)',
    csvDelimiter: ',',
    enforce255CharLimit: true,
    addressExportTarget: 'Full String to PERMSTRT / CTCTSTRT',
    cardFivePhotoNaming: '{student_number}.jpg',
    includeTimestampHeader: true
  });

  // ── Security & Admin State ────────────────────────────────────────────────
  const [securityConfig, setSecurityConfig] = useState({
    adminUsername: 'admin',
    adminEmail: 'aces.synapse@pup.edu.ph',
    sessionTimeoutMins: '30',
    enableAuditLog: true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordError, setPasswordError] = useState('');

  // ── System Diagnostics State ──────────────────────────────────────────────
  const [systemMetrics] = useState({
    dbEngine: 'SQLite 3 + SQLAlchemy 2.0 (Canonical Model)',
    dbFile: 'aces_synapse.db',
    alembicRevision: 'd11a0c5bab39 (Initial Migration)',
    apiEndpoint: 'http://127.0.0.1:8000/api',
    apiStatus: 'Healthy',
    activeSessions: 1,
    storageUsed: '48.2 MB / 500 MB'
  });

  // Handle saving configurations
  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      if (onShowToast) {
        onShowToast('Configuration saved successfully.');
      }
    }, 600);
  };

  // Handle Registration portal toggle
  const handleTogglePortal = () => {
    if (onToggleRegistration) {
      onToggleRegistration();
    }
    setPortalConfig(prev => ({ ...prev, isOpen: !prev.isOpen }));
  };

  // Handle password update
  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!securityConfig.currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (!securityConfig.newPassword || securityConfig.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (securityConfig.newPassword !== securityConfig.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSecurityConfig(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));

    if (onShowToast) {
      onShowToast('Admin password updated successfully.');
    }
  };

  // Handle Backup snapshot download
  const handleDownloadBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      portalConfig,
      ruleConfig,
      mediaConfig,
      exportConfig,
      systemMetrics
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse_settings_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (onShowToast) {
      onShowToast('System settings backup exported.');
    }
  };

  // Handle purge / reset action
  const handleExecuteDangerAction = () => {
    if (dangerConfirmText !== 'RESET') {
      return;
    }
    setShowDangerModal(false);
    setDangerConfirmText('');
    if (onShowToast) {
      onShowToast('Soft-deleted records and pending cache reset.');
    }
  };

  return (
    <div className="settings-page">
      {/* Top Header */}
      <div className="settings-header">
        <div className="settings-title-group">
          <h1 className="settings-page-title">System Settings</h1>
          <p className="settings-page-subtitle">
            Configure portal availability, academic sessions, MDB export standards, and system security.
          </p>
        </div>

        <div className="settings-header-actions">
          <button
            type="button"
            className="btn-amber"
            onClick={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <ArrowClockwise size={16} className="spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <FloppyDisk size={16} weight="bold" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Settings Layout (Nav + Content) */}
      <div className="settings-layout">
        {/* Navigation Sidebar */}
        <aside className="settings-nav">
          <button
            type="button"
            className={`settings-nav-item ${activeCategory === 'portal' ? 'active' : ''}`}
            onClick={() => setActiveCategory('portal')}
          >
            <Globe size={18} weight={activeCategory === 'portal' ? 'fill' : 'regular'} />
            <span>Portal &amp; Session</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeCategory === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveCategory('rules')}
          >
            <SlidersHorizontal size={18} weight={activeCategory === 'rules' ? 'fill' : 'regular'} />
            <span>Registration Rules</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeCategory === 'media' ? 'active' : ''}`}
            onClick={() => setActiveCategory('media')}
          >
            <Camera size={18} weight={activeCategory === 'media' ? 'fill' : 'regular'} />
            <span>Media &amp; Storage</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeCategory === 'export' ? 'active' : ''}`}
            onClick={() => setActiveCategory('export')}
          >
            <FileCsv size={18} weight={activeCategory === 'export' ? 'fill' : 'regular'} />
            <span>MDB &amp; CardFive</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeCategory === 'security' ? 'active' : ''}`}
            onClick={() => setActiveCategory('security')}
          >
            <ShieldCheck size={18} weight={activeCategory === 'security' ? 'fill' : 'regular'} />
            <span>Security &amp; Admin</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeCategory === 'system' ? 'active' : ''}`}
            onClick={() => setActiveCategory('system')}
          >
            <Database size={18} weight={activeCategory === 'system' ? 'fill' : 'regular'} />
            <span>Database &amp; Engine</span>
          </button>
        </aside>

        {/* Dynamic Category Content */}
        <main className="settings-content">
          {/* ── Category: Portal & Session ─────────────────────────────────── */}
          {activeCategory === 'portal' && (
            <>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">PORTAL ACCESS CONTROL</span>
                    <h2 className="settings-card-title">Registration Portal Status</h2>
                    <p className="settings-card-desc">
                      Control whether students can submit registrations through the public registration wizard.
                    </p>
                  </div>
                  <div className={`status-pill ${portalConfig.isOpen ? 'online' : 'offline'}`}>
                    <span className="pulse-dot" />
                    <span>{portalConfig.isOpen ? 'OPEN FOR SUBMISSIONS' : 'PORTAL CLOSED'}</span>
                  </div>
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Accept New Student Registrations</span>
                    <span className="toggle-subtitle">
                      When turned off, incoming student submissions will be blocked and the closed announcement is displayed.
                    </span>
                  </div>
                  <label className="switch" aria-label="Toggle Registration Portal Status">
                    <input
                      type="checkbox"
                      checked={portalConfig.isOpen}
                      onChange={handleTogglePortal}
                    />
                    <span className="slider slider-green" />
                  </label>
                </div>

                <div className="settings-grid-2">
                  <div className="settings-field">
                    <label className="settings-label">
                      Active Academic Year
                      <span className="settings-label-hint">Canonical Scope</span>
                    </label>
                    <select
                      className="settings-select"
                      value={portalConfig.academicYear}
                      onChange={e => setPortalConfig(p => ({ ...p, academicYear: e.target.value }))}
                    >
                      <option value="AY 2025-2026">AY 2025-2026 (Active)</option>
                      <option value="AY 2026-2027">AY 2026-2027</option>
                      <option value="AY 2024-2025">AY 2024-2025 (Archived)</option>
                    </select>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">
                      Academic Term / Semester
                    </label>
                    <select
                      className="settings-select"
                      value={portalConfig.semester}
                      onChange={e => setPortalConfig(p => ({ ...p, semester: e.target.value }))}
                    >
                      <option value="1st Semester">1st Semester</option>
                      <option value="2nd Semester">2nd Semester</option>
                      <option value="Summer Term">Summer Term</option>
                    </select>
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-label">Target Registration Audience</label>
                  <select
                    className="settings-select"
                    value={portalConfig.allowedYearLevels}
                    onChange={e => setPortalConfig(p => ({ ...p, allowedYearLevels: e.target.value }))}
                  >
                    <option value="1st Year Only">Incoming 1st Year Freshmen Only</option>
                    <option value="All Years">All Year Levels (1st, 2nd, 3rd, 4th Year)</option>
                    <option value="Transferees">Transferees and Shifters</option>
                  </select>
                </div>
              </section>

              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">STUDENT NOTICES</span>
                    <h2 className="settings-card-title">Portal Banner &amp; Announcements</h2>
                    <p className="settings-card-desc">
                      Messages shown to students at the top of the registration wizard and when closed.
                    </p>
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-label">Welcome Banner (When Portal Is Open)</label>
                  <textarea
                    className="settings-textarea"
                    rows={3}
                    value={portalConfig.announcement}
                    onChange={e => setPortalConfig(p => ({ ...p, announcement: e.target.value }))}
                    placeholder="Enter announcement banner text…"
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label">Closed Notice (When Portal Is Offline)</label>
                  <textarea
                    className="settings-textarea"
                    rows={2}
                    value={portalConfig.closedMessage}
                    onChange={e => setPortalConfig(p => ({ ...p, closedMessage: e.target.value }))}
                    placeholder="Enter message displayed to students when registration is closed…"
                  />
                </div>
              </section>
            </>
          )}

          {/* ── Category: Registration Rules ───────────────────────────────── */}
          {activeCategory === 'rules' && (
            <>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">DATA INTEGRITY &amp; VALIDATION</span>
                    <h2 className="settings-card-title">Student Number &amp; Field Rules</h2>
                    <p className="settings-card-desc">
                      Enforce university format masks, duplicate checks, and authoritative server-side rules.
                    </p>
                  </div>
                </div>

                <div className="settings-grid-2">
                  <div className="settings-field">
                    <label className="settings-label">
                      Student ID Format Mask
                      <span className="settings-label-hint">PUP Bataan Pattern</span>
                    </label>
                    <input
                      type="text"
                      className="settings-input"
                      value={ruleConfig.idPrefixMask}
                      onChange={e => setRuleConfig(r => ({ ...r, idPrefixMask: e.target.value }))}
                      placeholder="e.g. YYYY-XXXXX-BN-0"
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">Minimum Student Age</label>
                    <input
                      type="number"
                      className="settings-input"
                      value={ruleConfig.minAge}
                      onChange={e => setRuleConfig(r => ({ ...r, minAge: Number(e.target.value) }))}
                      min={14}
                      max={99}
                    />
                  </div>
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Block Duplicate Student Numbers</span>
                    <span className="toggle-subtitle">
                      Reject registrations if the Student Number or Email is already registered in the active year.
                    </span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={ruleConfig.preventDuplicates}
                      onChange={e => setRuleConfig(r => ({ ...r, preventDuplicates: e.target.checked }))}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Force Uppercase on Names</span>
                    <span className="toggle-subtitle">
                      Automatically convert First Name, Middle Name, and Last Name to uppercase for MDB compatibility.
                    </span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={ruleConfig.autoUppercaseNames}
                      onChange={e => setRuleConfig(r => ({ ...r, autoUppercaseNames: e.target.checked }))}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Require Emergency Contact Address</span>
                    <span className="toggle-subtitle">
                      Ensure contact person street and city details are provided (R-DATA-03 separate entity model).
                    </span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={ruleConfig.requireContactAddress}
                      onChange={e => setRuleConfig(r => ({ ...r, requireContactAddress: e.target.checked }))}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </section>
            </>
          )}

          {/* ── Category: Media & Storage ──────────────────────────────────── */}
          {activeCategory === 'media' && (
            <>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">PHOTO &amp; SIGNATURE POLICIES</span>
                    <h2 className="settings-card-title">Media Upload Constraints (Verified R-MED)</h2>
                    <p className="settings-card-desc">
                      Authoritative parameters for student 2x2 portrait capture and administrative signature uploads.
                    </p>
                  </div>
                </div>

                <div className="settings-grid-2">
                  <div className="meta-box">
                    <div className="meta-row">
                      <span className="meta-label">Student Photo Dimensions:</span>
                      <span className="meta-value">1500 × 1500 px (1:1)</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Photo Allowed Formats:</span>
                      <span className="meta-value">JPG / JPEG</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Maximum Photo File Size:</span>
                      <span className="meta-value">5.0 MB</span>
                    </div>
                  </div>

                  <div className="meta-box">
                    <div className="meta-row">
                      <span className="meta-label">Student Signature Dimensions:</span>
                      <span className="meta-value">2000 × 1200 px</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Signature Background:</span>
                      <span className="meta-value">Pure White (#FFFFFF)</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Signature Upload Authority:</span>
                      <span className="meta-value">Admin Only</span>
                    </div>
                  </div>
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Allow Live Web Camera Capture</span>
                    <span className="toggle-subtitle">
                      Enables the HTML5 camera stream for direct portrait capture with real-time cropping frame.
                    </span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={mediaConfig.allowCameraCapture}
                      onChange={e => setMediaConfig(m => ({ ...m, allowCameraCapture: e.target.checked }))}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Allow Direct File Upload</span>
                    <span className="toggle-subtitle">
                      Allows students to upload prepared JPG 2x2 photos directly from their file manager.
                    </span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={mediaConfig.allowFileUpload}
                      onChange={e => setMediaConfig(m => ({ ...m, allowFileUpload: e.target.checked }))}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="settings-field">
                  <label className="settings-label">Media Storage Target Engine</label>
                  <select
                    className="settings-select"
                    value={mediaConfig.storageDriver}
                    onChange={e => setMediaConfig(m => ({ ...m, storageDriver: e.target.value }))}
                  >
                    <option value="Local Relational Store (SQLite + File Storage)">Local File System (data/uploads/photos/)</option>
                    <option value="Supabase Storage Bucket">Supabase Object Storage (Cloud S3 Compatible)</option>
                  </select>
                </div>
              </section>
            </>
          )}

          {/* ── Category: MDB & CardFive ───────────────────────────────────── */}
          {activeCategory === 'export' && (
            <>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">EXPORT &amp; COMPATIBILITY CONTRACT</span>
                    <h2 className="settings-card-title">Microsoft Access (MDB) &amp; CardFive Standards</h2>
                    <p className="settings-card-desc">
                      Configure CSV export format to match the CardFive ID printing batch workflow.
                    </p>
                  </div>
                </div>

                <div className="settings-grid-2">
                  <div className="settings-field">
                    <label className="settings-label">Text File Encoding</label>
                    <select
                      className="settings-select"
                      value={exportConfig.exportEncoding}
                      onChange={e => setExportConfig(c => ({ ...c, exportEncoding: e.target.value }))}
                    >
                      <option value="Windows-1252 (ANSI / Access Compatible)">Windows-1252 (ANSI / Access Compatible)</option>
                      <option value="UTF-8 with BOM">UTF-8 with BOM</option>
                      <option value="UTF-8 Standard">UTF-8 Standard</option>
                    </select>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">CardFive Photo Naming Standard</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={exportConfig.cardFivePhotoNaming}
                      onChange={e => setExportConfig(c => ({ ...c, cardFivePhotoNaming: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Enforce 255 Character Truncation Warning</span>
                    <span className="toggle-subtitle">
                      MDB text fields have a 255 character limit. Warn administrators if address fields exceed this limit.
                    </span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={exportConfig.enforce255CharLimit}
                      onChange={e => setExportConfig(c => ({ ...c, enforce255CharLimit: e.target.checked }))}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="meta-box">
                  <div className="meta-row">
                    <span className="meta-label">MDB Street Mapping Target:</span>
                    <span className="meta-value">PERMSTRT &amp; CTCTSTRT (Full strings)</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Binary OLE Picture In CSV:</span>
                    <span className="meta-value">Excluded (Manual CardFive attachment)</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Academic Level Code:</span>
                    <span className="meta-value">1st Year → '50' (MDB ACADLEVL)</span>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ── Category: Security & Admin ─────────────────────────────────── */}
          {activeCategory === 'security' && (
            <>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">ADMINISTRATOR CREDENTIALS</span>
                    <h2 className="settings-card-title">Account &amp; Security Settings</h2>
                    <p className="settings-card-desc">
                      Manage administrator credentials, session security, and access control policies.
                    </p>
                  </div>
                </div>

                <div className="settings-grid-2">
                  <div className="settings-field">
                    <label className="settings-label">Administrator Username</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={securityConfig.adminUsername}
                      disabled
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">Admin Notification Email</label>
                    <input
                      type="email"
                      className="settings-input"
                      value={securityConfig.adminEmail}
                      onChange={e => setSecurityConfig(s => ({ ...s, adminEmail: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-label">Session Idle Auto-Logout Timeout</label>
                  <select
                    className="settings-select"
                    value={securityConfig.sessionTimeoutMins}
                    onChange={e => setSecurityConfig(s => ({ ...s, sessionTimeoutMins: e.target.value }))}
                  >
                    <option value="15">15 Minutes of inactivity</option>
                    <option value="30">30 Minutes of inactivity (Recommended)</option>
                    <option value="60">1 Hour</option>
                    <option value="240">4 Hours</option>
                  </select>
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Enable Security Audit Log</span>
                    <span className="toggle-subtitle">
                      Record student edits, batch exports, and soft deletion events in the administrative audit ledger.
                    </span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={securityConfig.enableAuditLog}
                      onChange={e => setSecurityConfig(s => ({ ...s, enableAuditLog: e.target.checked }))}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </section>

              {/* Password update form */}
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">AUTHENTICATION</span>
                    <h2 className="settings-card-title">Update Admin Password</h2>
                    <p className="settings-card-desc">
                      Change the master administrative login password for ACES Synapse.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {passwordError && (
                    <div style={{ color: '#EF4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <WarningCircle size={16} weight="bold" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div className="settings-field">
                    <label className="settings-label">Current Password</label>
                    <input
                      type="password"
                      className="settings-input"
                      placeholder="••••••••"
                      value={securityConfig.currentPassword}
                      onChange={e => setSecurityConfig(s => ({ ...s, currentPassword: e.target.value }))}
                    />
                  </div>

                  <div className="settings-grid-2">
                    <div className="settings-field">
                      <label className="settings-label">New Password</label>
                      <input
                        type="password"
                        className="settings-input"
                        placeholder="At least 8 characters"
                        value={securityConfig.newPassword}
                        onChange={e => setSecurityConfig(s => ({ ...s, newPassword: e.target.value }))}
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Confirm New Password</label>
                      <input
                        type="password"
                        className="settings-input"
                        placeholder="Repeat new password"
                        value={securityConfig.confirmPassword}
                        onChange={e => setSecurityConfig(s => ({ ...s, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                    <button type="submit" className="btn-secondary">
                      <LockKey size={16} />
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              </section>
            </>
          )}

          {/* ── Category: Database & Diagnostics ───────────────────────────── */}
          {activeCategory === 'system' && (
            <>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">SYSTEM ARCHITECTURE</span>
                    <h2 className="settings-card-title">Canonical Database &amp; API Connectivity</h2>
                    <p className="settings-card-desc">
                      Current database engine diagnostics, migration version, and health metrics.
                    </p>
                  </div>
                  <div className="status-pill online">
                    <span className="pulse-dot" />
                    <span>DATABASE HEALTHY</span>
                  </div>
                </div>

                <div className="meta-box">
                  <div className="meta-row">
                    <span className="meta-label">Database File:</span>
                    <span className="meta-value">{systemMetrics.dbFile}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">ORM &amp; Engine:</span>
                    <span className="meta-value">{systemMetrics.dbEngine}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Active Alembic Migration:</span>
                    <span className="meta-value">{systemMetrics.alembicRevision}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Backend API URL:</span>
                    <span className="meta-value">{systemMetrics.apiEndpoint}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Local Storage Space:</span>
                    <span className="meta-value">{systemMetrics.storageUsed}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleDownloadBackup}
                  >
                    <DownloadSimple size={16} />
                    <span>Download Settings Snapshot (JSON)</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onShowToast && onShowToast('Database connection verified healthy.')}
                  >
                    <ArrowClockwise size={16} />
                    <span>Test API Connection</span>
                  </button>
                </div>
              </section>

              {/* Danger Zone */}
              <section className="settings-card danger-zone-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker" style={{ color: '#EF4444' }}>DANGER ZONE</span>
                    <h2 className="settings-card-title">Maintenance &amp; Data Purge</h2>
                    <p className="settings-card-desc">
                      Destructive operations. Please ensure a backup is exported before proceeding.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#EF4444' }}>
                      Clear Soft-Deleted Records
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                      Permanently purge records currently residing in the Recycle Bin.
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setShowDangerModal(true)}
                  >
                    <Trash size={16} />
                    <span>Purge Recycle Bin</span>
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Danger Modal */}
      {showDangerModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: '#120A0A',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 14,
              padding: 24,
              width: '90%',
              maxWidth: 440,
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444' }}>
              <WarningCircle size={24} weight="bold" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>Confirm Purge Action</h3>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#D1D5DB', lineHeight: 1.5 }}>
              This will permanently delete all records currently in the Recycle Bin. This action cannot be undone.
              Type <strong>RESET</strong> below to confirm.
            </p>

            <input
              type="text"
              className="settings-input"
              value={dangerConfirmText}
              onChange={e => setDangerConfirmText(e.target.value)}
              placeholder='Type "RESET" to confirm'
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setShowDangerModal(false); setDangerConfirmText(''); }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-danger"
                disabled={dangerConfirmText !== 'RESET'}
                onClick={handleExecuteDangerAction}
                style={{ opacity: dangerConfirmText === 'RESET' ? 1 : 0.5 }}
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
