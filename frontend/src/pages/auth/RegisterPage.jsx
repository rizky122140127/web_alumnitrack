import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirmation: '',
    role: 'alumni',
    nisn: '',
    graduation_year: new Date().getFullYear(),
    current_status: 'mahasiswa',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
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

    if (formData.password !== formData.password_confirmation) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    if (formData.role === 'alumni' && formData.nisn.length !== 10) {
      setError('NISN harus 10 digit angka.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone_number: formData.phone_number,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role: formData.role,
      };

      if (formData.role === 'alumni') {
        payload.nisn = formData.nisn;
        payload.graduation_year = parseInt(formData.graduation_year);
        payload.current_status = formData.current_status;
      }

      const user = await register(payload);
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
    <div className="login-container" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div className="login-card" style={{ maxWidth: '520px' }}>
        <div className="login-logo">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
          <h1>Daftar Akun Baru</h1>
          <p>Sistem Alumni Tracker SMAN 1 Talang Padang</p>
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
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Minimal 6 karakter"
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
          </div>

          <div className="form-group">
            <label className="form-label">Status Registrasi</label>
            <select
              name="role"
              className="form-input form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="alumni">Alumni SMAN 1 Talang Padang</option>
              <option value="siswa">Siswa Aktif</option>
            </select>
          </div>

          {formData.role === 'alumni' && (
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.25rem', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#818cf8', marginBottom: '0.75rem' }}>
                Data Profil Alumni
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label">NISN (10 Digit) *</label>
                  <input
                    type="text"
                    name="nisn"
                    maxLength={10}
                    className="form-input"
                    placeholder="0012345678"
                    value={formData.nisn}
                    onChange={handleChange}
                    required={formData.role === 'alumni'}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label">Tahun Kelulusan *</label>
                  <input
                    type="number"
                    name="graduation_year"
                    className="form-input"
                    min="2000"
                    max="2030"
                    value={formData.graduation_year}
                    onChange={handleChange}
                    required={formData.role === 'alumni'}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
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
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
          Sudah punya akun?{' '}
          <Link to="/auth/login" style={{ color: '#818cf8', fontWeight: 600 }}>
            Masuk ke Akun Anda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
