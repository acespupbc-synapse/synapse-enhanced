import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import BackgroundVanta from './components/BackgroundVanta';
import Sidebar from './components/Sidebar';
import BentoGrid from './components/BentoGrid';
import RegistrationsView from './components/views/RegistrationsView';
import ProgramsView from './components/views/ProgramsView';
import ExportView from './components/views/ExportView';
import RecycleBinView from './components/views/RecycleBinView';
import SettingsView from './components/views/SettingsView';
import LoginView from './components/views/LoginView';
import StudentRegistrationView from './components/views/StudentRegistrationView';
import RegistrationClosedView from './components/views/RegistrationClosedView';
import { statsApi, settingsApi, exportApi, authApi } from './services/api';
import './index.css';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize authentication from stored token
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem('synapse_auth_token'))
  );
  const [isDark, setIsDark] = useState(true);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [stats, setStats] = useState({
    isRegistrationOpen: true,
    enrolledCount: 0,
    dbStatus: 'Online',
    ayName: 'AY 2026-2027',
    cpuPercent: 0,
    latencyMs: 0,
    recycleBinCount: 0,
    programCounts: {},
  });

  // Fetch live stats from backend
  const fetchStats = useCallback(async () => {
    try {
      const data = await statsApi.getDashboardStats();
      setStats((prev) => ({
        ...prev,
        isRegistrationOpen: data.isRegistrationOpen ?? prev.isRegistrationOpen,
        enrolledCount: data.enrolledCount ?? prev.enrolledCount,
        dbStatus: data.dbStatus ?? prev.dbStatus,
        ayName: data.activeAcademicYear ?? prev.ayName,
        recycleBinCount: data.recycleBinCount ?? 0,
        programCounts: data.programCounts ?? {},
        cpuPercent: data.cpuPercent ?? 0,
        latencyMs: data.latencyMs ?? 0,
      }));
    } catch (_) {
      // Backend not available — keep default values silently
    }
  }, []);

  // Polling interval: auto-refresh stats every 12 seconds when authenticated
  useEffect(() => {
    fetchStats();
    if (isAuthenticated) {
      const timer = setInterval(fetchStats, 12000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, fetchStats]);

  // Theme synchronization with HTML root attribute
  useEffect(() => {
    if (!isAuthenticated || isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDark, isAuthenticated]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleRegistration = async (explicitState) => {
    const nextState = explicitState !== undefined ? explicitState : !stats.isRegistrationOpen;
    showToast(nextState ? 'Registration is now OPEN' : 'Registration is now CLOSED');
    try {
      await settingsApi.toggleRegistration(nextState);
    } catch (_) {}
    setStats((prev) => ({ ...prev, isRegistrationOpen: nextState }));
  };

  const handleExportCsv = async () => {
    try {
      const downloaded = await exportApi.downloadCsv();
      if (downloaded) {
        showToast('CardFive MDB CSV downloaded successfully!');
        return;
      }
    } catch (_) {}
    showToast('Export failed or no records available.');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (_) {}
    localStorage.removeItem('synapse_auth_token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="app-container">
                <div className="login-bg-layer" />
                <LoginView
                  onLogin={() => {
                    setIsAuthenticated(true);
                    navigate('/dashboard');
                  }}
                  onRegister={() => navigate('/register')}
                />
              </div>
            )
          }
        />

        <Route
          path="/register"
          element={
            !stats.isRegistrationOpen ? (
              <RegistrationClosedView
                academicYear={stats.ayName}
                onBack={() => navigate('/login')}
              />
            ) : (
              <StudentRegistrationView
                onBack={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              />
            )
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/*"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace state={{ from: location }} />
            ) : (
              <div className="app-container">
                <BackgroundVanta isDark={isDark} />

                <Sidebar
                  isOpenMobile={isOpenMobile}
                  setIsOpenMobile={setIsOpenMobile}
                  onLogout={handleLogout}
                  onOpenRegistration={() => navigate('/register')}
                />

                <div className="main-wrapper">
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/dashboard" replace />}
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <BentoGrid
                          stats={stats}
                          onNavigateTab={(tab, code) => {
                            if (code) navigate(`/registrations/${code}`);
                            else if (tab === 'recycle') navigate('/recycle-bin');
                            else navigate(`/${tab}`);
                          }}
                          onShowToast={showToast}
                        />
                      }
                    />
                    <Route
                      path="/registrations"
                      element={
                        <RegistrationsView
                          onShowToast={showToast}
                          stats={stats}
                        />
                      }
                    />
                    <Route
                      path="/registrations/:programCode"
                      element={
                        <RegistrationsView
                          onShowToast={showToast}
                          stats={stats}
                        />
                      }
                    />
                    <Route
                      path="/registrations/:orgCode/:programCode"
                      element={
                        <RegistrationsView
                          onShowToast={showToast}
                          stats={stats}
                        />
                      }
                    />
                    <Route path="/programs" element={<ProgramsView />} />
                    <Route path="/recycle-bin" element={<RecycleBinView />} />
                    <Route
                      path="/export"
                      element={<ExportView onExportCsv={handleExportCsv} />}
                    />
                    <Route
                      path="/settings"
                      element={
                        <SettingsView
                          stats={stats}
                          onToggleRegistration={handleToggleRegistration}
                          onShowToast={showToast}
                        />
                      }
                    />
                    <Route
                      path="*"
                      element={<Navigate to="/dashboard" replace />}
                    />
                  </Routes>
                </div>
              </div>
            )
          }
        />
      </Routes>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--text-primary)',
            color: 'var(--bg-page)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            boxShadow: 'var(--shadow-card-hover)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
