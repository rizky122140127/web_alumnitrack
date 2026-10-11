import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  GraduationCap,
  MessageSquareText,
  CalendarDays,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';
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
            background: 'rgba(24, 34, 30, 0.32)',
            zIndex: 35,
          }}
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <img src="/logo-sman1-talang-padang.png" alt="Logo SMAN 1 Talang Padang" />
          </div>
          <div className="sidebar-brand-text">
            <h2>AlumniTracker</h2>
            <span>SMAN 1 Talang Padang</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {isAdmin ? (
            <>
              <div className="sidebar-section-title">ADMINISTRASI</div>
              <NavLink
                to="/admin/dashboard"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <ChartNoAxesCombined className="link-icon" size={18} strokeWidth={1.8} />
                <span>Dashboard Analitik</span>
              </NavLink>
              <NavLink
                to="/admin/alumni"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <UsersRound className="link-icon" size={18} strokeWidth={1.8} />
                <span>Direktori Alumni</span>
              </NavLink>
              <NavLink
                to="/admin/registrations"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <UserRoundCheck className="link-icon" size={18} strokeWidth={1.8} />
                <span>Verifikasi Pendaftaran</span>
              </NavLink>
              <NavLink
                to="/admin/tracer-questions"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <BookOpen className="link-icon" size={18} strokeWidth={1.8} />
                <span>Kelola Tracer Study</span>
              </NavLink>
              <NavLink
                to="/admin/rekap"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <ChartNoAxesCombined className="link-icon" size={18} strokeWidth={1.8} />
                <span>Rekapitulasi Akreditasi</span>
              </NavLink>
              <NavLink
                to="/admin/career"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <BriefcaseBusiness className="link-icon" size={18} strokeWidth={1.8} />
                <span>Lowongan & Beasiswa</span>
              </NavLink>
              <NavLink
                to="/admin/events"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <CalendarDays className="link-icon" size={18} strokeWidth={1.8} />
                <span>Event Sekolah & Alumni</span>
              </NavLink>
              <NavLink
                to="/admin/notifications"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <MessageSquareText className="link-icon" size={18} strokeWidth={1.8} />
                <span>WA Gateway Log</span>
              </NavLink>
              <NavLink
                to="/admin/users"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <ShieldCheck className="link-icon" size={18} strokeWidth={1.8} />
                <span>Pengelola Admin</span>
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
                <GraduationCap className="link-icon" size={18} strokeWidth={1.8} />
                <span>Beranda</span>
              </NavLink>
              <NavLink
                to="/alumni/tracer"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <BookOpen className="link-icon" size={18} strokeWidth={1.8} />
                <span>Kuesioner Tracer</span>
              </NavLink>
              <NavLink
                to="/alumni/career"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <BriefcaseBusiness className="link-icon" size={18} strokeWidth={1.8} />
                <span>Lowongan & Beasiswa</span>
              </NavLink>
              <NavLink
                to="/alumni/events"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <CalendarDays className="link-icon" size={18} strokeWidth={1.8} />
                <span>Event Sekolah & Alumni</span>
              </NavLink>
              <NavLink
                to="/alumni/profile"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <UserRound className="link-icon" size={18} strokeWidth={1.8} />
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
