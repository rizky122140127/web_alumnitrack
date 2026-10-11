import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import AuthBrand from '../../components/auth/AuthBrand';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import SchoolFooter from '../../components/SchoolFooter';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const googleCode = searchParams.get('google_code');
  const [formData, setFormData] = useState({
    name: searchParams.get('name') || (searchParams.get('google_code') ? 'Alumni' : ''),
    email: searchParams.get('email') || '',
    phone_number: '',
    password: '',
    password_confirmation: '',
    nisn: '',
    graduation_year: new Date().getFullYear(),
    current_status: 'mahasiswa',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, registerWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!googleCode && formData.password !== formData.password_confirmation) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    if (formData.nisn.length !== 10) {
      setError('NISN harus 10 digit angka.');
      return;
    }

    setLoading(true);

    try {
      if (googleCode) {
        await registerWithGoogle({
          code: googleCode,
          phone_number: formData.phone_number,
          nisn: formData.nisn,
          graduation_year: parseInt(formData.graduation_year, 10),
          current_status: formData.current_status,
        });
        toast.info('Pendaftaran Google berhasil dikirim dan menunggu verifikasi admin.');
        navigate('/auth/login');
        return;
      }

      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone_number: formData.phone_number,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        current_status: formData.current_status,
      };

      payload.nisn = formData.nisn;
      payload.graduation_year = parseInt(formData.graduation_year, 10);

      const { user, approvalStatus } = await register(payload);
      if (approvalStatus === 'pending') {
        toast.info('Pendaftaran berhasil dikirim. Akun dapat digunakan setelah diverifikasi admin.');
        navigate('/auth/login');
        return;
      }
      toast.success('Pendaftaran akun berhasil! Selamat datang.');
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/alumni/dashboard');
      }
    } catch (err) {
      const responseErrors = err.response?.data?.errors;
      if (responseErrors) {
        const firstErrorKey = Object.keys(responseErrors)[0];
        setError(responseErrors[firstErrorKey][0]);
      } else {
        setError(err.response?.data?.message || 'Gagal melakukan pendaftaran. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-page auth-page-register">
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
          <span className="auth-eyebrow">{googleCode ? 'PENDAFTARAN ALUMNI' : 'BERGABUNG DENGAN ALUMNITRACKER'}</span>
          <h1>{googleCode ? 'Lengkapi data alumni' : 'Buat akun alumni'}</h1>
          <p>{googleCode ? 'Lengkapi data sebagai alumni yang telah lulus agar pendaftaran dapat diverifikasi.' : 'Pendaftaran ini khusus alumni yang telah lulus dan perlu diverifikasi oleh admin.'}</p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="Contoh: Budi Santoso"
              value={formData.name}
              onChange={handleChange}
              readOnly={Boolean(googleCode)}
              required
            />
          </div>

          <div className="auth-form-grid">
            <div className="form-group">
              <label className="form-label">No. WhatsApp *</label>
              <input
                type="text"
                name="phone_number"
                className="form-input"
                placeholder="628123456789"
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email (Opsional)</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="alumni@email.com"
                value={formData.email}
                onChange={handleChange}
                readOnly={Boolean(googleCode)}
              />
            </div>
          </div>

          {!googleCode && <div className="auth-form-grid">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Minimal 8 karakter"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ulangi Password *</label>
              <input
                type="password"
                name="password_confirmation"
                className="form-input"
                placeholder="Konfirmasi password"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
              />
            </div>
          </div>}

          <div className="auth-alumni-fields">
            <div>Data Alumni</div>

            <div className="auth-form-grid">
              <div className="form-group">
                <label className="form-label">NISN (10 Digit) *</label>
                <input
                  type="text"
                  name="nisn"
                  maxLength={10}
                  className="form-input"
                  placeholder="0012345678"
                  value={formData.nisn}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tahun Kelulusan *</label>
                <input
                  type="number"
                  name="graduation_year"
                  className="form-input"
                  min="2000"
                  max="2030"
                  value={formData.graduation_year}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Aktivitas Saat Ini</label>
              <select
                name="current_status"
                className="form-input form-select"
                value={formData.current_status}
                onChange={handleChange}
              >
                <option value="mahasiswa">Melanjutkan Kuliah (Mahasiswa)</option>
                <option value="bekerja">Bekerja</option>
                <option value="wirausaha">Wirausaha / Bisnis</option>
                <option value="gap_year">Gap Year / Persiapan</option>
                <option value="belum_kerja">Belum Bekerja</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
          </button>
        </form>

        {!googleCode && <>
        <div className="auth-divider"><span>atau daftar dengan</span></div>
        <GoogleAuthButton>Daftar dengan Google</GoogleAuthButton>
        </>}

        <div className="login-register-link">
          Sudah punya akun?{' '}
          <Link to="/auth/login">
            Masuk ke Akun Anda
          </Link>
        </div>
      </div>
        </section>
        <SchoolFooter />
      </div>
    </div>
  );
};

export default RegisterPage;
