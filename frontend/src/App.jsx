import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import BackgroundVanta from './components/BackgroundVanta';
import Sidebar from './components/Sidebar';
import BentoGrid from './components/BentoGrid';
import RegistrationsView from './components/views/RegistrationsView';
import ProgramsView from './components/views/ProgramsView';
import RecycleBinView from './components/views/RecycleBinView';
import SettingsView from './components/views/SettingsView';
import HomeView from './components/views/HomeView';
import LoginView from './components/views/LoginView';
import StudentRegistrationView from './components/views/StudentRegistrationView';
import RegistrationClosedView from './components/views/RegistrationClosedView';
import { statsApi, settingsApi, authApi, studentApi } from './services/api';
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
    liveUsers: 1,
    recycleBinCount: 0,
    programCounts: {},
  });

  const [dashboardCapacity, setDashboardCapacity] = useState({
    usedRecords: 0,
    maxRecords: 500,
    percentage: 2.10,
    storageUsedMb: 10.52,
    storageMaxMb: 500,
  });

  const [dashboardFeed, setDashboardFeed] = useState([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  // Route Navigation Loading Progress (QoL 3)
  const [isRouteNavigating, setIsRouteNavigating] = useState(false);
  const prevPathRef = React.useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setIsRouteNavigating(true);
      const timer = setTimeout(() => {
        setIsRouteNavigating(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Fetch unified dashboard bundle from backend (stats + capacity + feed in 1 roundtrip)
  const fetchFullDashboard = useCallback(async () => {
    try {
      const data = await statsApi.getFullDashboard();
      if (data) {
        if (data.stats) {
          setStats((prev) => ({
            ...prev,
            isRegistrationOpen: data.stats.isRegistrationOpen ?? prev.isRegistrationOpen,
            enrolledCount: data.stats.enrolledCount ?? prev.enrolledCount,
            dbStatus: data.stats.dbStatus ?? prev.dbStatus,
            ayName: data.stats.activeAcademicYear ?? prev.ayName,
            recycleBinCount: data.stats.recycleBinCount ?? 0,
            // Only overwrite programCounts if the response is non-empty to prevent
            // a transient stale cache response from blanking real data (Bug 18)
            programCounts: Object.keys(data.stats.programCounts ?? {}).length > 0
              ? data.stats.programCounts
              : prev.programCounts,
            cpuPercent: data.stats.cpuPercent ?? 0,
            latencyMs: data.stats.latencyMs ?? 0,
            liveUsers: data.stats.liveUsers != null ? data.stats.liveUsers : prev.liveUsers,
          }));
        }
        if (data.capacity) {
          setDashboardCapacity(data.capacity);
        }
        if (Array.isArray(data.feed)) {
          setDashboardFeed(
            data.feed.map((item) => ({
              id: item.id,
              name: item.name,
              course: item.course,
              section: `${item.course || ''} ${item.section || ''}`.trim() || '—',
              studentNumber: item.student_number || '',
              photoUrl: item.photo_url || null,
              time: item.time
                ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Recently',
            }))
          );
        }
      }
    } catch (_) {
      // Graceful fallback
    } finally {
      setIsDashboardLoading(false);
    }
  }, []);

  // Graceful initial skeleton load on mount (QoL 2)
  useEffect(() => {
    setIsDashboardLoading(true);
    const start = Date.now();
    fetchFullDashboard().finally(() => {
      const elapsed = Date.now() - start;
      const delay = Math.max(0, 450 - elapsed);
      setTimeout(() => setIsDashboardLoading(false), delay);
    });
  }, [fetchFullDashboard]);

  // ── Global Visitor Heartbeat for Accurate Active Users (Bug 16) ────────
  useEffect(() => {
    let sessionId = sessionStorage.getItem('synapse_visitor_session');
    if (!sessionId) {
      sessionId = 'vis_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      sessionStorage.setItem('synapse_visitor_session', sessionId);
    }

    // Initial ping
    studentApi.heartbeat(sessionId);

    // Heartbeat every 15 seconds
    const interval = setInterval(() => {
      studentApi.heartbeat(sessionId);
    }, 15000);

    const handleLeave = () => {
      try {
        const payload = JSON.stringify({ session_id: sessionId });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/students/heartbeat/leave', new Blob([payload], { type: 'application/json' }));
        } else {
          studentApi.heartbeatLeave(sessionId);
        }
      } catch (_) {}
    };

    window.addEventListener('beforeunload', handleLeave);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleLeave);
    };
  }, []);

  // Optimized real-time polling: every 4 seconds when tab is visible, plus instant wakeup on focus
  useEffect(() => {
    fetchFullDashboard();
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchFullDashboard();
      }
    }, 4000);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchFullDashboard();
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [isAuthenticated, fetchFullDashboard]);

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

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (_) {}
    localStorage.removeItem('synapse_auth_token');
    setIsAuthenticated(false);
    navigate('/home');
  };

  return (
    <>
      <Routes>
        {/* Public Landing Homepage: / and /home (Always public portal, never auto-redirect to dashboard) */}
        <Route
          path="/"
          element={
            <div className="app-container">
              <div className="login-bg-layer" />
              <HomeView />
            </div>
          }
        />

        <Route
          path="/home"
          element={
            <div className="app-container">
              <div className="login-bg-layer" />
              <HomeView />
            </div>
          }
        />

        {/* Admin Login: /login */}
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
                />
              </div>
            )
          }
        />

        {/* Student Registration Form */}
        <Route
          path="/register"
          element={
            !stats.isRegistrationOpen ? (
              <RegistrationClosedView
                academicYear={stats.ayName}
                onBack={() => navigate('/home')}
              />
            ) : (
              <StudentRegistrationView
                onBack={() => navigate('/home')}
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
                {isRouteNavigating && <div className="app-top-nav-loader" />}
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
                          capacity={dashboardCapacity}
                          feed={dashboardFeed}
                          isLoading={isDashboardLoading}
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
                      path="/settings"
                      element={
                        <SettingsView
                          stats={stats}
                          onToggleRegistration={handleToggleRegistration}
                          onShowToast={showToast}
                          onRefreshStats={fetchFullDashboard}
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

      {/* Vercel Web Analytics */}
      <Analytics />
    </>
  );
}
