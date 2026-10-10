import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Spinner from '../../components/ui/Spinner';

const MagicLinkVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const { token: routeToken } = useParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const { loginWithMagicLink } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const rawToken = routeToken || searchParams.get('token');
    if (!rawToken) {
      setStatus('error');
      setErrorMessage('Token Magic Link tidak ditemukan dalam tautan.');
      return;
    }

    const verify = async () => {
      try {
        const user = await loginWithMagicLink(rawToken.trim());
        setStatus('success');
        toast.success(`Login berhasil! Selamat datang, ${user.name}`);
        setTimeout(() => {
          if (user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/alumni/dashboard');
          }
        }, 1200);
      } catch (err) {
        setStatus('error');
        setErrorMessage(
          err.response?.data?.message || 'Token Magic Link telah kadaluarsa atau sudah digunakan.'
        );
      }
    };

    verify();
  }, [routeToken, searchParams, loginWithMagicLink, navigate, toast]);

  return (
    <div className="login-container">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {status === 'verifying' ? '⏳' : status === 'success' ? '🎉' : '❌'}
        </div>

        {status === 'verifying' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Memverifikasi Magic Link...
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Mohon tunggu sejenak, kami sedang mengotentikasi sesi Anda dari WhatsApp.
            </p>
            <Spinner size="md" text="" />
          </div>
        )}

        {status === 'success' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>
              Autentikasi Berhasil!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Mengarahkan Anda ke portal dalam beberapa detik...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171', marginBottom: '0.5rem' }}>
              Gagal Masuk
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {errorMessage}
            </p>
            <Link to="/auth/login" className="btn btn-primary" style={{ width: '100%' }}>
              Kembali ke Halaman Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MagicLinkVerifyPage;
