import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const getTitleFromPath = (path) => {
  if (path.includes('/admin/dashboard')) return 'Dashboard Analitik BK';
  if (path.includes('/admin/alumni')) return 'Direktori & Database Alumni';
  if (path.includes('/admin/tracer-questions')) return 'Manajemen Kuesioner Tracer Study';
  if (path.includes('/admin/rekap')) return 'Rekapitulasi Akreditasi Sekolah';
  if (path.includes('/admin/career')) return 'Moderasi Lowongan & Push WA';
  if (path.includes('/admin/notifications')) return 'Log Notifikasi WhatsApp Gateway';
  if (path.includes('/alumni/dashboard')) return 'Portal Alumni';
  if (path.includes('/alumni/tracer')) return 'Kuesioner Tracer Study Alumni';
  if (path.includes('/alumni/career')) return 'Informasi Karir & Beasiswa';
  if (path.includes('/alumni/profile')) return 'Pengaturan Profil Alumni';
  return 'Sistem Informasi Alumni Tracker';
};

const AppLayout = () => {
  const location = useLocation();
  const pageTitle = getTitleFromPath(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="app-main">
        <Navbar
          pageTitle={pageTitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
