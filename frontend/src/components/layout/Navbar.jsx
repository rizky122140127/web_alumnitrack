import React from 'react';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../ui/Badge';

const Navbar = ({ pageTitle = 'Dashboard', onToggleSidebar, isNavigationExpanded }) => {
  const { user, logout } = useAuth();

  return (
    <header className="app-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          className="hamburger"
          onClick={onToggleSidebar}
          aria-label={isNavigationExpanded ? 'Sembunyikan menu navigasi' : 'Tampilkan menu navigasi'}
          aria-expanded={isNavigationExpanded}
          title={isNavigationExpanded ? 'Sembunyikan menu navigasi' : 'Tampilkan menu navigasi'}
        >
          <Menu size={19} strokeWidth={1.8} />
        </button>
        <h2 className="topbar-title">
          {pageTitle}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="topbar-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="topbar-user-name">
              {user?.name || 'User'}
            </span>
            <div style={{ marginTop: '2px' }}>
              <Badge variant={user?.role === 'admin' ? 'primary' : 'success'} size="sm">
                {user?.role === 'admin' ? 'Admin' : user?.role === 'alumni' ? 'Alumni' : 'Siswa'}
              </Badge>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Keluar dari akun"
        >
          <LogOut size={15} strokeWidth={1.8} />
          Keluar
        </button>
      </div>
    </header>
  );
};

export default Navbar;
