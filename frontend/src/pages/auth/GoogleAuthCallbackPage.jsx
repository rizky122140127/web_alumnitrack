import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthBrand from '../../components/auth/AuthBrand';
import SchoolFooter from '../../components/SchoolFooter';

const GoogleAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const { loginWithGoogleCode } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = searchParams.get('code');
    if (!code) {
      setError('Kode autentikasi Google tidak ditemukan. Silakan coba masuk kembali.');
      return;
    }

    loginWithGoogleCode(code)
      .then((user) => {
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/alumni/dashboard', { replace: true });
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Autentikasi Google gagal. Silakan coba lagi.');
      });
  }, [loginWithGoogleCode, navigate, searchParams]);

  return (
    <div className="auth-shell">
      <div className="auth-page">
        <AuthBrand />
        <section className="auth-panel">
        <div className="login-card auth-callback-card">
          <div className="login-logo">
            <span className="auth-eyebrow">AUTENTIKASI GOOGLE</span>
            <h1>{error ? 'Belum berhasil masuk' : 'Memverifikasi akun'}</h1>
            <p>{error || 'Mohon tunggu, kami sedang menyiapkan sesi Anda.'}</p>
          </div>
          {error && (
            <div className="login-register-link">
              <Link to="/auth/login">Kembali ke halaman masuk</Link>
            </div>
          )}
        </div>
        </section>
        <SchoolFooter />
      </div>
    </div>
  );
};

export default GoogleAuthCallbackPage;
