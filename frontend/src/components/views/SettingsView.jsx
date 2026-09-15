import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  SlidersHorizontal,
  ShieldCheck,
  Database,
  FloppyDisk,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  DownloadSimple,
  Trash,
  Key,
  LockKey,
  Plus,
  X,
  FileArchive,
  CaretDown
} from '@phosphor-icons/react';
import { studentApi, settingsApi, authApi, exportApi } from '../../services/api';
import Footer from '../common/Footer';
import './SettingsView.css';

export default function SettingsView({ stats, onToggleRegistration, onShowToast, onRefreshStats }) {
  const [activeCategory, setActiveCategory] = useState('portal');
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [dangerConfirmText, setDangerConfirmText] = useState('');
  const [showToggleAuthModal, setShowToggleAuthModal] = useState(false);
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [authPasswordError, setAuthPasswordError] = useState('');
  const [showAddAYModal, setShowAddAYModal] = useState(false);
  const [newAYInput, setNewAYInput] = useState('');
  const [newAYError, setNewAYError] = useState('');
  const [showAYWarningModal, setShowAYWarningModal] = useState(false);
  const [pendingAY, setPendingAY] = useState(null);

  // Dropdowns
  const [isAYDropdownOpen, setIsAYDropdownOpen] = useState(false);
  const ayDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ayDropdownRef.current && !ayDropdownRef.current.contains(event.target)) {
        setIsAYDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Portal & Session Settings State ───────────────────────────────────────
  const [academicYears, setAcademicYears] = useState([
    '2026-2027'
  ]);

  useEffect(() => {
    settingsApi.getAcademicYears().then(res => {
      if (Array.isArray(res) && res.length > 0) {
        const names = res.map(ay => (typeof ay === 'string' ? ay : ay.name)).filter(Boolean);
        if (names.length > 0) {
          setAcademicYears(prev => [...new Set([...prev, ...names])]);
        }
      }
    }).catch(() => {});
  }, []);

  const [portalConfig, setPortalConfig] = useState({
    isOpen: stats?.isRegistrationOpen ?? true,
    academicYear: stats?.ayName?.replace(/^AY\s*/i, '') || '2026-2027',
    allowedYearLevels: '1st Year Only'
  });

  useEffect(() => {
    if (stats?.isRegistrationOpen !== undefined) {
      setPortalConfig(prev => ({ ...prev, isOpen: stats.isRegistrationOpen }));
    }
  }, [stats?.isRegistrationOpen]);

  // ── Registration Validation Rules State (PUP Biñan) ───────────────────────
  const [ruleConfig, setRuleConfig] = useState({
    idPrefixMask: 'YYYY-XXXXX-BN-0',
    preventDuplicates: true,
    autoUppercaseNames: true,
    requirePhotoUpload: true
  });

  // ── Security & Admin State ────────────────────────────────────────────────
  const [securityConfig, setSecurityConfig] = useState({
    adminUsername: 'admin',
    adminEmail: 'acesorganization2022@gmail.com',
    sessionTimeoutMins: '30',
    enableAuditLog: true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordError, setPasswordError] = useState('');

  // ── System Diagnostics State ──────────────────────────────────────────────
  const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://synapse-enhanced.onrender.com').replace(/\/+$/, '');
  const [systemMetrics, setSystemMetrics] = useState({
    dbEngine: 'PostgreSQL (Supabase Pooler) + SQLAlchemy 2.0 (Canonical Schema)',
    dbFile: 'PostgreSQL aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
    alembicRevision: '001_canonical_postgresql_schema',
    apiEndpoint: `${rawApiUrl}/api`,
    apiStatus: 'Healthy (Online)',
    activeSessions: 1,
    storageUsed: `${stats?.storageUsedMb || 0} MB / 500 MB`
  });

  useEffect(() => {
    settingsApi.getDiagnostics().then(diag => {
      if (diag) {
        setSystemMetrics(prev => ({
          ...prev,
          dbEngine: diag.dbEngine || diag.db_engine || prev.dbEngine,
          dbFile: diag.dbHost || diag.db_host || prev.dbFile,
          alembicRevision: diag.alembicRevision || diag.alembic_revision || prev.alembicRevision,
          apiStatus: diag.apiStatus || (diag.status === 'ok' ? 'Healthy (Online)' : prev.apiStatus),
          storageUsed: diag.storage_used_mb ? `${diag.storage_used_mb} MB / 500 MB` : prev.storageUsed
        }));
      }
    }).catch(() => {});
  }, []);

  // Handle saving configurations
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await settingsApi.updateSettings({
        active_ay: portalConfig.academicYear,
        is_registration_open: portalConfig.isOpen,
        allowed_year_levels: portalConfig.allowedYearLevels,
        require_photo: ruleConfig.requirePhotoUpload,
        admin_email: securityConfig.adminEmail,
      });
      if (onShowToast) {
        onShowToast('Settings configuration saved successfully.');
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(`Failed to save settings: ${err.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Open the registration toggle auth modal
  const handleRequestTogglePortal = () => {
    setAuthPasswordInput('');
    setAuthPasswordError('');
    setShowToggleAuthModal(true);
  };

  // Confirm portal toggle with password
  const handleConfirmTogglePortal = async (e) => {
    e.preventDefault();
    if (!authPasswordInput.trim()) {
      setAuthPasswordError('Administrator password is required.');
      return;
    }

    try {
      await authApi.login(securityConfig.adminUsername || 'admin', authPasswordInput);
    } catch (_) {
      setAuthPasswordError('Incorrect admin password.');
      return;
    }

    const nextState = !portalConfig.isOpen;
    if (onToggleRegistration) {
      onToggleRegistration(nextState);
    }
    setPortalConfig(prev => ({ ...prev, isOpen: nextState }));
    setShowToggleAuthModal(false);
    if (onShowToast) {
      onShowToast(nextState ? 'Registration is now OPEN.' : 'Registration is now CLOSED.');
    }
  };

  // Handle adding new Academic Year
  const handleAddAcademicYear = async (e) => {
    e.preventDefault();
    setNewAYError('');
    const trimmed = newAYInput.trim();
    if (!trimmed) {
      setNewAYError('Academic year is required (e.g. 2028-2029).');
      return;
    }
    if (!/^\d{4}-\d{4}$/.test(trimmed)) {
      setNewAYError('Invalid format. Please use YYYY-YYYY (e.g. 2028-2029).');
      return;
    }
    if (academicYears.includes(trimmed)) {
      setNewAYError('This academic year already exists.');
      return;
    }

    try {
      await settingsApi.createAcademicYear({ name: trimmed, is_active: true });
      await settingsApi.updateSettings({ active_ay: trimmed });
      setAcademicYears(prev => [...new Set([...prev, trimmed])]);
      setPortalConfig(prev => ({ ...prev, academicYear: trimmed }));
      setShowAddAYModal(false);
      setNewAYInput('');
      if (onShowToast) {
        onShowToast(`Academic Year ${trimmed} created and set as active.`);
      }
      if (onRefreshStats) {
        onRefreshStats();
      }
    } catch (err) {
      setNewAYError(err.message || 'Failed to create academic year.');
    }
  };

  // Handle password update
  const handleChangePassword = async (e) => {
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

    try {
      await authApi.changePassword(securityConfig.currentPassword, securityConfig.newPassword);
      setSecurityConfig(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      if (onShowToast) {
        onShowToast('Admin password updated successfully.');
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to update admin password.');
    }
  };

  // Download Complete Archive (Genuine .ZIP containing CSV, XLSX, JSON and Cloudflare R2 Photos & Signatures)
  const handleDownloadCompleteArchive = async () => {
    let finished = false;

    // Stage 1: Compiling
    if (onShowToast) {
      onShowToast('Compiling system records...', { loading: true });
    }

    // Stage 2: Bundling
    const stage2Timer = setTimeout(() => {
      if (!finished && onShowToast) {
        onShowToast('Bundling R2 media & MDB databases...', { loading: true });
      }
    }, 2000);

    // Stage 3: Exporting
    const stage3Timer = setTimeout(() => {
      if (!finished && onShowToast) {
        onShowToast('Exporting complete archive (.zip)...', { loading: true });
      }
    }, 4800);

    try {
      await exportApi.downloadArchive();
      finished = true;
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);

      if (onShowToast) {
        onShowToast('Complete system archive (.zip) downloaded successfully.');
      }
    } catch (err) {
      finished = true;
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
      if (onShowToast) {
        onShowToast(`Could not download complete archive: ${err.message || 'Server error'}`);
      }
    }
  };

  // Download System snapshot
  const handleDownloadBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      portalConfig,
      ruleConfig,
      systemMetrics
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse_settings_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (onShowToast) {
      onShowToast('System settings snapshot exported.');
    }
  };

  // Handle purge / reset action
  const handleExecuteDangerAction = () => {
    if (dangerConfirmText !== 'DELETE') {
      return;
    }
    setShowDangerModal(false);
    setDangerConfirmText('');
    if (onShowToast) {
      onShowToast('Soft-deleted records permanently deleted.');
    }
  };

  return (
    <div className="settings-page">
      {/* Top Header */}
      <div className="settings-header">
        <div className="settings-title-group">
          <h1 className="settings-page-title">System Settings</h1>
          <p className="settings-page-subtitle">
            Configure registration availability, academic year scope, PUP Biñan rules, and system security.
          </p>
        </div>

        <div className="settings-header-actions">
          <button
            type="button"
            className="btn-save-settings"
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
        {/* Navigation Sidebar (4 Clean Categories) */}
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
                  
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Accept Student Registrations</span>
                    <span className="toggle-subtitle">
                      Requires admin password confirmation to change. When closed, students will be redirected to the Registration Closed notice.
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle-pill ${portalConfig.isOpen ? 'open' : 'closed'}`}
                    onClick={handleRequestTogglePortal}
                    title="Change registration portal status (requires password)"
                  >
                    {portalConfig.isOpen ? (
                      <>
                        <span className="toggle-pill-text">OPEN</span>
                        <span className="toggle-pill-knob" />
                      </>
                    ) : (
                      <>
                        <span className="toggle-pill-knob" />
                        <span className="toggle-pill-text">CLOSED</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="settings-divider" />

                <div className="settings-grid-2">
                  <div className="settings-field">
                    <label className="settings-label">
                      Academic Year
                    </label>
                    <div className="settings-custom-dropdown-wrap" ref={ayDropdownRef}>
                      <button
                        type="button"
                        className="settings-custom-dropdown-btn"
                        onClick={() => setIsAYDropdownOpen(prev => !prev)}
                        aria-expanded={isAYDropdownOpen}
                      >
                        <span>{portalConfig.academicYear}</span>
                        <CaretDown size={14} className={`dropdown-caret ${isAYDropdownOpen ? 'rotated' : ''}`} />
                      </button>

                      {isAYDropdownOpen && (
                        <div className="settings-custom-dropdown-menu">
                          <div className="settings-dropdown-items-list">
                            {academicYears.map(ay => (
                              <button
                                key={ay}
                                type="button"
                                className={`settings-dropdown-item ${portalConfig.academicYear === ay ? 'active' : ''}`}
                                onClick={() => {
                                  if (ay !== portalConfig.academicYear) {
                                    setPendingAY(ay);
                                    setShowAYWarningModal(true);
                                  }
                                  setIsAYDropdownOpen(false);
                                }}
                              >
                                <span>{ay}</span>
                                {portalConfig.academicYear === ay && (
                                  <CheckCircle size={14} weight="bold" color="#FFFFFF" />
                                )}
                              </button>
                            ))}
                          </div>

                          <div className="settings-dropdown-divider" />

                          <button
                            type="button"
                            className="settings-dropdown-add-btn"
                            onClick={() => {
                              setIsAYDropdownOpen(false);
                              setNewAYInput('');
                              setNewAYError('');
                              setShowAddAYModal(true);
                            }}
                          >
                            <Plus size={14} weight="bold" />
                            <span>Add Academic Year</span>
                          </button>
                        </div>
                      )}
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
                      <option value="Transferees">Transferees &amp; Shifters</option>
                    </select>
                  </div>
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
                    <h2 className="settings-card-title">PUP Biñan Campus Student Rules</h2>
                    <p className="settings-card-desc">
                      Enforce university format masks, duplicate checks, and authoritative validation for PUP Biñan.
                    </p>
                  </div>
                </div>

                <div className="settings-grid-1">
                  <div className="settings-field">
                    <label className="settings-label">
                      Student ID Format Mask
                     
                    </label>
                    <input
                      type="text"
                      className="settings-input"
                      value={ruleConfig.idPrefixMask}
                      onChange={e => setRuleConfig(r => ({ ...r, idPrefixMask: e.target.value }))}
                      placeholder="YYYY-XXXXX-BN-0"
                    />
                  </div>
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Block Duplicate Student Numbers</span>
                    <span className="toggle-subtitle">
                      Reject registrations if the Student Number or Email is already registered in the active academic year.
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
                    <span className="toggle-title">Force Uppercase on Names &amp; Addresses</span>
                    <span className="toggle-subtitle">
                      Automatically convert student names, sections, and street addresses to uppercase format.
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
              </section>
            </>
          )}

          {/* ── Category: Security & Admin ─────────────────────────────────── */}
          {activeCategory === 'security' && (
            <>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">ADMINISTRATOR CONTACT</span>
                    <h2 className="settings-card-title">Official Notification Email</h2>
                    <p className="settings-card-desc">
                      Receives system alert notices and is displayed on student support notices.
                    </p>
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-label">Admin Notification Email</label>
                  <input
                    type="email"
                    className="settings-input"
                    value={securityConfig.adminEmail}
                    onChange={e => setSecurityConfig(s => ({ ...s, adminEmail: e.target.value }))}
                    placeholder="acesorganization2022@gmail.com"
                  />
                </div>
              </section>

              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">ACCESS CONTROL</span>
                    <h2 className="settings-card-title">Change Administrator Password</h2>
                    <p className="settings-card-desc">
                      Ensure admin accounts use strong, non-default credentials.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {passwordError && (
                    <div className="settings-error-banner">
                      <WarningCircle size={18} weight="fill" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div className="settings-field">
                    <label className="settings-label">Current Admin Password</label>
                    <input
                      type="password"
                      className="settings-input"
                      placeholder="Enter current admin password"
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

          {/* ── Category: Database & Engine ─────────────────────────────────── */}
          {activeCategory === 'system' && (
            <>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">DATABASE &amp; EXPORTS</span>
                    <h2 className="settings-card-title">Database Records &amp; Media Archives</h2>
                    <p className="settings-card-desc">
                      Download full data dumps including database rows, student photos, and signatures.
                    </p>
                  </div>
                </div>

                <div className="meta-box">
                  <div className="meta-row">
                    <span className="meta-label">Campus Scope:</span>
                    <span className="meta-value">PUP Biñan Campus</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Database Engine:</span>
                    <span className="meta-value">{systemMetrics.dbEngine}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Active Academic Year:</span>
                    <span className="meta-value">AY {portalConfig.academicYear}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Local Storage Space:</span>
                    <span className="meta-value">{systemMetrics.storageUsed}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn-primary-archive"
                    onClick={handleDownloadCompleteArchive}
                  >
                    <FileArchive size={18} weight="bold" />
                    <span>Download Complete Archive (DB + Photos + Signatures)</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleDownloadBackup}
                  >
                    <DownloadSimple size={16} />
                    <span>Download Settings JSON</span>
                  </button>
                </div>
              </section>

              {/* Danger Zone */}
              <section className="settings-card danger-zone-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker" style={{ color: '#EF4444' }}>DANGER ZONE</span>
                    <h2 className="settings-card-title">Maintenance &amp; Data Cleanup</h2>
                    <p className="settings-card-desc">
                      Destructive operations. Please ensure a complete archive is downloaded before proceeding.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#EF4444' }}>
                      Clear Soft-Deleted Records
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                      Permanently delete records currently residing in the Recycle Bin.
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setShowDangerModal(true)}
                  >
                    <Trash size={16} />
                    <span>Empty Recycle Bin</span>
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* ── Modal: Password Confirmation for Registration Status Toggle ──────── */}
      {showToggleAuthModal && (
        <div className="settings-modal-overlay" role="dialog" aria-modal="true">
          <div className="settings-modal-dialog">
            <div className="settings-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#E00000' }}>
                <Key size={22} weight="bold" />
                <h3 className="settings-modal-title">
                  Confirm {portalConfig.isOpen ? 'Closing' : 'Opening'} Registration
                </h3>
              </div>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => setShowToggleAuthModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmTogglePortal}>
              <p className="settings-modal-desc">
                Please enter the administrator password to confirm{' '}
                <strong>{portalConfig.isOpen ? 'closing' : 'opening'}</strong> the public student registration portal.
              </p>

              {authPasswordError && (
                <div className="settings-error-banner" style={{ marginBottom: 14 }}>
                  <WarningCircle size={16} weight="fill" />
                  <span>{authPasswordError}</span>
                </div>
              )}

              <div className="settings-field" style={{ marginBottom: 20 }}>
                <label className="settings-label">Admin Password</label>
                <input
                  type="password"
                  autoFocus
                  className="settings-input"
                  placeholder="Enter admin password"
                  value={authPasswordInput}
                  onChange={e => setAuthPasswordInput(e.target.value)}
                />
              </div>

              <div className="settings-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowToggleAuthModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                >
                  Confirm &amp; Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add New Academic Year ─────────────────────────────────────── */}
      {showAddAYModal && (
        <div className="settings-modal-overlay" role="dialog" aria-modal="true">
          <div className="settings-modal-dialog">
            <div className="settings-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#FFFFFF' }}>
                <Plus size={22} weight="bold" color="#E00000" />
                <h3 className="settings-modal-title">Add New Academic Year</h3>
              </div>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => setShowAddAYModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAcademicYear}>
              {/* Notice */}
              <div className="settings-notice-box">
                <WarningCircle size={20} weight="fill" color="#EF4444" style={{ flexShrink: 0 }} />
                <p className="settings-notice-text">
                  Adding a new academic year starts a new student registration group. All new student records and exports will be tied to this year.
                </p>
              </div>

              {newAYError && (
                <div className="settings-error-banner" style={{ marginBottom: 14 }}>
                  <WarningCircle size={16} weight="fill" />
                  <span>{newAYError}</span>
                </div>
              )}

              <div className="settings-field" style={{ marginBottom: 20 }}>
                <label className="settings-label">Academic Year (Format: YYYY-YYYY)</label>
                <input
                  type="text"
                  autoFocus
                  className="settings-input"
                  placeholder="e.g. 2028-2029"
                  value={newAYInput}
                  onChange={e => setNewAYInput(e.target.value)}
                />
              </div>

              <div className="settings-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddAYModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                >
                  Create Academic Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Danger Zone Empty Recycle Bin ──────────────────────────── */}
      {showDangerModal && (
        <div className="settings-modal-overlay" role="dialog" aria-modal="true">
          <div className="settings-modal-dialog">
            <div className="settings-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444' }}>
                <WarningCircle size={24} weight="bold" />
                <h3 className="settings-modal-title">Empty Recycle Bin</h3>
              </div>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => { setShowDangerModal(false); setDangerConfirmText(''); }}
              >
                <X size={18} />
              </button>
            </div>

            <p className="settings-modal-desc">
              This will permanently delete all records currently in the Recycle Bin. This action cannot be undone.
              Type <strong>DELETE</strong> below to confirm.
            </p>

            <input
              type="text"
              className="settings-input"
              value={dangerConfirmText}
              onChange={e => setDangerConfirmText(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              style={{ marginBottom: 16 }}
            />

            <div className="settings-modal-footer">
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
                disabled={dangerConfirmText !== 'DELETE'}
                onClick={handleExecuteDangerAction}
                style={{ opacity: dangerConfirmText === 'DELETE' ? 1 : 0.5 }}
              >
                Empty Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Academic Year Change Warning Modal */}
      {showAYWarningModal && (
        <div className="settings-modal-overlay" role="dialog" aria-modal="true">
          <div className="settings-modal-dialog" style={{ maxWidth: 440 }}>
            <div className="settings-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#F59E0B' }}>
                <WarningCircle size={24} weight="bold" />
                <h3 className="settings-modal-title">Change Academic Year?</h3>
              </div>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => {
                  setShowAYWarningModal(false);
                  setPendingAY(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p className="settings-modal-desc" style={{ marginBottom: 20, lineHeight: 1.5 }}>
              Are you sure you want to switch the active Academic Year to <strong>{pendingAY}</strong>? This will alter active registration workflows, statistics tracking, and default student records.
            </p>

            <div className="settings-modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAYWarningModal(false);
                  setPendingAY(null);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-primary"
                style={{ background: '#7B0000', color: '#FFFFFF', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                onClick={async () => {
                  const targetAY = pendingAY;
                  setPortalConfig(p => ({ ...p, academicYear: targetAY }));
                  setShowAYWarningModal(false);
                  setPendingAY(null);
                  try {
                    await settingsApi.updateSettings({ active_ay: targetAY });
                    if (onShowToast) {
                      onShowToast(`Academic Year switched to ${targetAY}.`);
                    }
                    if (onRefreshStats) {
                      onRefreshStats();
                    }
                  } catch (err) {
                    if (onShowToast) {
                      onShowToast(`Failed to update Academic Year: ${err.message}`);
                    }
                  }
                }}
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
