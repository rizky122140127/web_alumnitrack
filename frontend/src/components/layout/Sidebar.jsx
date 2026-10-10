import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();

  return (
    <>
      {/* Backdrop overlay on smartphone / tablet */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 35,
          }}
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🎓</div>
          <div className="sidebar-brand-text">
            <h2>AlumniTracker</h2>
            <span>SMAN 1 Talang Padang</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {isAdmin ? (
            <>
              <div className="sidebar-section-title">ADMINISTRASI BK</div>
              <NavLink
                to="/admin/dashboard"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon">📊</span>
                <span>Dashboard Analitik</span>
              </NavLink>
              <NavLink
                to="/admin/alumni"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon">👥</span>
                <span>Direktori Alumni</span>
              </NavLink>
              <NavLink
                to="/admin/tracer-questions"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon">📋</span>
                <span>Kelola Tracer Study</span>
              </NavLink>
              <NavLink
                to="/admin/rekap"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon">📈</span>
                <span>Rekapitulasi Akreditasi</span>
              </NavLink>
              <NavLink
                to="/admin/career"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon">💼</span>
                <span>Moderasi Lowongan</span>
              </NavLink>
              <NavLink
                to="/admin/notifications"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon">💬</span>
                <span>WA Gateway Log</span>
              </NavLink>
            </>
          ) : (
            <>
              <div className="sidebar-section-title">PORTAL ALUMNI</div>
              <NavLink
                to="/alumni/dashboard"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon">🏠</span>
                <span>Beranda</span>
              </NavLink>
              <NavLink
                to="/alumni/tracer"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon">✍️</span>
                <span>Kuesioner Tracer</span>
              </NavLink>
              <NavLink
                to="/alumni/career"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon">💼</span>
                <span>Lowongan & Beasiswa</span>
              </NavLink>
              <NavLink
                to="/alumni/profile"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon">👤</span>
                <span>Profil Saya</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="name">{user?.name || 'User'}</div>
              <div className="role">{user?.role || 'Guest'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
