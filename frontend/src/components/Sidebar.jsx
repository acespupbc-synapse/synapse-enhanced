import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  House,
  Users,
  GraduationCap,
  Trash,
  Gear,
  UserPlus,
  SignOut,
  List,
  X
} from '@phosphor-icons/react';
import './Sidebar.css';

export default function Sidebar({
  isOpenMobile,
  setIsOpenMobile,
  onLogout,
  onOpenRegistration
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard',     path: '/dashboard',     label: 'Dashboard',     icon: House },
    { id: 'registrations', path: '/registrations', label: 'Registrations', icon: Users },
    { id: 'programs',      path: '/programs',      label: 'Programs',      icon: GraduationCap },
    { id: 'recycle',       path: '/recycle-bin',   label: 'Recycle Bin',   icon: Trash },
    { id: 'settings',      path: '/settings',      label: 'Settings',      icon: Gear },
  ];

  // Mobile bottom nav includes Student Registration as a dedicated tab
  const mobileNavItems = [
    { id: 'dashboard',     path: '/dashboard',     label: 'Dashboard',  icon: House },
    { id: 'registrations', path: '/registrations', label: 'Students',   icon: Users },
    { id: 'register',      path: null,             label: 'Register',   icon: UserPlus, action: true },
    { id: 'programs',      path: '/programs',      label: 'Programs',   icon: GraduationCap },
    { id: 'settings',      path: '/settings',      label: 'Settings',   icon: Gear },
  ];

  const [navigatingPath, setNavigatingPath] = React.useState(null);

  React.useEffect(() => {
    if (navigatingPath && location.pathname.startsWith(navigatingPath)) {
      const timer = setTimeout(() => setNavigatingPath(null), 300);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, navigatingPath]);

  const handleNavClick = (path) => {
    if (path !== location.pathname) {
      setNavigatingPath(path);
    }
    navigate(path);
    if (setIsOpenMobile) {
      setIsOpenMobile(false);
    }
  };

  const isItemActive = (item) => {
    if (item.path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      {/* Mobile Top Header — only on mobile, hidden on desktop */}
      <header className="mobile-header">
        <div className="mobile-header-brand">
          <img src="/img/logo/synapse-banner.png" alt="ACES Synapse" className="mobile-banner-img" />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="sidebar-container">
        
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <img
            src="/img/logo/synapse-banner.png"
            alt="ACES Synapse"
            className="sidebar-brand-banner"
          />
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            const isNavigating = navigatingPath === item.path;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''} ${isNavigating ? 'navigating' : ''}`}
                onClick={() => handleNavClick(item.path)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-item-icon">
                  <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                </span>
                <span className="nav-item-label">{item.label}</span>
                {isNavigating && <span className="nav-item-spinner" aria-label="Loading page" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        {/* Bottom Actions: Student Registration & Logout */}
        <div className="sidebar-footer">
          <button
            className="btn-sidebar-primary"
            onClick={onOpenRegistration || (() => navigate('/register'))}
            title="Open Student Registration Portal"
          >
            <UserPlus size={20} />
            <span>Student Registration</span>
          </button>
          
          <button
            className="btn-sidebar-danger"
            onClick={onLogout || (() => { localStorage.removeItem('synapse_auth_token'); navigate('/login'); })}
          >
            <SignOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path ? isItemActive(item) : false;
          return (
            <button
              key={item.id}
              className={`mobile-bottom-nav-item ${isActive ? 'active' : ''} ${item.action ? 'action' : ''}`}
              onClick={() => {
                if (item.action) {
                  (onOpenRegistration || (() => navigate('/register')))();
                } else {
                  handleNavClick(item.path);
                }
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
