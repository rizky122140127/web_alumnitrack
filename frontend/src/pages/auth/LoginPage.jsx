import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import AuthBrand from '../../components/auth/AuthBrand';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import SchoolFooter from '../../components/SchoolFooter';
import PublicEventsPreview from '../../components/auth/PublicEventsPreview';

const LoginPage = ({ adminOnly = false }) => {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  const { login, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    const googleError = searchParams.get('google_error');
    if (googleError) {
      setError(googleError);
    }
  }, [searchParams]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(adminOnly
        ? { login: loginInput, password }
        : { nisn: loginInput, password });
      if (adminOnly && user.role !== 'admin') {
        await logout();
        const msg = 'Akun ini bukan akun admin. Silakan gunakan halaman login alumni.';
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success(`Selamat datang kembali, ${user.name}!`);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/alumni/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Nomor HP/Email atau Password salah.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-page auth-page-login">
        <AuthBrand />
        <section className="auth-panel">
        <div className="auth-mobile-heading">
          <div className="auth-brand-mark">
            <img src="/logo-sman1-talang-padang.png" alt="Logo SMAN 1 Talang Padang" />
          </div>
          <span>AlumniTracker</span>
        </div>
        <div className="login-card">
          <div className="login-logo">
            <span className="auth-eyebrow">{adminOnly ? 'PORTAL ADMINISTRATOR' : 'PORTAL ALUMNI'}</span>
            <h1>{adminOnly ? 'Masuk sebagai admin' : 'Selamat datang kembali'}</h1>
            <p>
              {adminOnly
                ? 'Gunakan akun admin untuk membuka panel administrasi.'
                : 'Masuk untuk melanjutkan ke akun AlumniTracker Anda.'}
            </p>
          </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label className="form-label">{adminOnly ? 'Email atau nomor WhatsApp admin' : 'NISN (10 digit)'}</label>
            <input
              type="text"
              className="form-input"
              inputMode={adminOnly ? undefined : 'numeric'}
              maxLength={adminOnly ? undefined : 10}
              placeholder={adminOnly ? 'Contoh: 6281234567890 atau email' : 'Masukkan NISN 10 digit'}
              value={loginInput}
              onChange={(e) => setLoginInput(adminOnly ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Masukkan kata sandi..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk ke Portal'}
          </button>
        </form>

        <div className="auth-divider"><span>atau masuk dengan</span></div>
        <GoogleAuthButton intent={adminOnly ? 'admin' : undefined} />

        <div className="login-register-link">
          {adminOnly ? (
            <>
              Kembali ke{' '}
              <Link to="/auth/login">login alumni</Link>
            </>
          ) : (
            <>
              Belum memiliki akun?{' '}
              <Link to="/auth/register">Registrasi Alumni Baru</Link>
              <span className="auth-admin-link">
                Pengelola sekolah? <Link to="/auth/admin">Login admin</Link>
              </span>
            </>
          )}
        </div>
      </div>
        </section>
        {!adminOnly && <PublicEventsPreview />}
        <SchoolFooter />
      </div>
    </div>
  );
};

export default LoginPage;
