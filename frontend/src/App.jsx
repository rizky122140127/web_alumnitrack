import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Spinner from './components/ui/Spinner';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MagicLinkVerifyPage from './pages/auth/MagicLinkVerifyPage';

// Alumni Pages
import AlumniDashboardPage from './pages/alumni/DashboardPage';
import TracerStudyPage from './pages/alumni/TracerStudyPage';
import CareerPage from './pages/alumni/CareerPage';
import ProfilePage from './pages/alumni/ProfilePage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminAlumniPage from './pages/admin/AdminAlumniPage';
import AdminTracerPage from './pages/admin/AdminTracerPage';
import AdminRecapPage from './pages/admin/AdminRecapPage';
import AdminCareerPage from './pages/admin/AdminCareerPage';
import AdminNotificationPage from './pages/admin/AdminNotificationPage';

// Protected Route wrappers
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner text="Memuat sesi pengguna..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <Spinner text="Memeriksa hak akses..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/alumni/dashboard" replace />;
  }

  return children;
};

const RootRedirect = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <Spinner text="Mengalihkan..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/alumni/dashboard" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/magic-link" element={<MagicLinkVerifyPage />} />
      <Route path="/auth/magic-link/:token" element={<MagicLinkVerifyPage />} />

      {/* Protected Routes inside AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Alumni Routes */}
        <Route path="/alumni/dashboard" element={<AlumniDashboardPage />} />
        <Route path="/alumni/tracer" element={<TracerStudyPage />} />
        <Route path="/alumni/career" element={<CareerPage />} />
        <Route path="/alumni/profile" element={<ProfilePage />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/alumni"
          element={
            <AdminRoute>
              <AdminAlumniPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tracer-questions"
          element={
            <AdminRoute>
              <AdminTracerPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/rekap"
          element={
            <AdminRoute>
              <AdminRecapPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/career"
          element={
            <AdminRoute>
              <AdminCareerPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <AdminRoute>
              <AdminNotificationPage />
            </AdminRoute>
          }
        />
      </Route>

      {/* Root & Catch All */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;
