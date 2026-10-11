import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import SchoolFooter from '../SchoolFooter';

const getTitleFromPath = (path) => {
  if (path.includes('/admin/dashboard')) return 'Dashboard Analitik Admin';
  if (path.includes('/admin/alumni')) return 'Direktori & Database Alumni';
  if (path.includes('/admin/registrations')) return 'Verifikasi Pendaftaran Alumni';
  if (path.includes('/admin/tracer-questions')) return 'Manajemen Kuesioner Tracer Study';
  if (path.includes('/admin/rekap')) return 'Rekapitulasi Akreditasi Sekolah';
  if (path.includes('/admin/events')) return 'Manajemen Event Sekolah & Alumni';
  if (path.includes('/admin/career')) return 'Moderasi Lowongan & Beasiswa';
  if (path.includes('/admin/notifications')) return 'Log Notifikasi WhatsApp Gateway';
  if (path.includes('/admin/users')) return 'Pengelola Admin';
  if (path.includes('/alumni/dashboard')) return 'Portal Alumni';
  if (path.includes('/alumni/tracer')) return 'Kuesioner Tracer Study Alumni';
  if (path.includes('/alumni/career')) return 'Lowongan & Beasiswa';
  if (path.includes('/alumni/events')) return 'Event Sekolah & Alumni';
  if (path.includes('/alumni/profile')) return 'Pengaturan Profil Alumni';
  return 'Sistem Informasi Alumni Tracker';
};

const AppLayout = () => {
  const location = useLocation();
  const pageTitle = getTitleFromPath(location.pathname);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateViewport = (event) => setIsMobile(event.matches);
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  const handleToggleSidebar = () => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      setMobileSidebarOpen((isOpen) => !isOpen);
      return;
    }

    setDesktopSidebarCollapsed((isCollapsed) => !isCollapsed);
  };

  return (
    <div className={`app-layout ${desktopSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="app-main">
        <Navbar
          pageTitle={pageTitle}
          onToggleSidebar={handleToggleSidebar}
          isNavigationExpanded={isMobile ? mobileSidebarOpen : !desktopSidebarCollapsed}
        />
        <main className="app-content">
          <Outlet />
        </main>
        <SchoolFooter />
      </div>
    </div>
  );
};

export default AppLayout;
