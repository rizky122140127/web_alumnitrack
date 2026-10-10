import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../ui/Badge';

const Navbar = ({ pageTitle = 'Dashboard', onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="app-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          className="hamburger"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          title="Buka Menu"
        >
          ☰
        </button>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#171717' }}>
          {pageTitle}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#000000',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#171717' }}>
              {user?.name || 'User'}
            </span>
            <div style={{ marginTop: '2px' }}>
              <Badge variant={user?.role === 'admin' ? 'primary' : 'success'} size="sm">
                {user?.role === 'admin' ? 'Guru BK / Admin' : user?.role === 'alumni' ? 'Alumni' : 'Siswa'}
              </Badge>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          style={{
            border: '1px solid #E5E5E5',
            color: '#171717',
            cursor: 'pointer',
          }}
          title="Keluar dari akun"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
