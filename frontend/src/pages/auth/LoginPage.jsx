import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const LoginPage = () => {
  const [tab, setTab] = useState('password'); // 'password' | 'magic'
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [magicToken, setMagicToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, loginWithMagicLink } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({ login: loginInput, password });
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

  const handleMagicSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginWithMagicLink(magicToken.trim());
      toast.success(`Login berhasil melalui Magic Link! Halo ${user.name}`);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/alumni/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Token Magic Link tidak valid atau sudah kadaluarsa.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo fill
  const fillDemoAdmin = () => {
    setTab('password');
    setLoginInput('6281234567890');
    setPassword('admin123');
  };

  const fillDemoAlumni = () => {
    setTab('password');
    setLoginInput('6281200000001');
    setPassword('alumni123');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
          <h1>AlumniTracker</h1>
          <p>Sistem Informasi Penelusuran Alumni SMAN 1 Talang Padang</p>
        </div>

        {/* Tab switch */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '0.5rem',
            padding: '4px',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => { setTab('password'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              background: tab === 'password' ? '#6366f1' : 'transparent',
              color: tab === 'password' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setTab('magic'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              background: tab === 'magic' ? '#6366f1' : 'transparent',
              color: tab === 'magic' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            Magic Link WA
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              color: '#fca5a5',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}
          >
            {error}
          </div>
        )}

        {tab === 'password' ? (
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">No. WhatsApp / Email</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 6281234567890 atau email"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
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
        ) : (
          <form onSubmit={handleMagicSubmit}>
            <div className="form-group">
              <label className="form-label">Kode Token Magic Link (WA)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Tempel 64-karakter token link WA..."
                value={magicToken}
                onChange={(e) => setMagicToken(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                Jika Anda menerima tautan login via WhatsApp, masukkan token atau buka langsung link tersebut.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Memvalidasi Token...' : 'Masuk dengan Token'}
            </button>
          </form>
        )}

        {/* Demo Quick login buttons */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginBottom: '0.75rem' }}>
            ⚡ Akses Demo Cepat:
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
            >
              🔑 Guru BK (Admin)
            </button>
            <button
              type="button"
              onClick={fillDemoAlumni}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
            >
              🎓 Alumni (Fauzi)
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
          Belum terdaftar?{' '}
          <Link to="/auth/register" style={{ color: '#818cf8', fontWeight: 600 }}>
            Registrasi Alumni Baru
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
