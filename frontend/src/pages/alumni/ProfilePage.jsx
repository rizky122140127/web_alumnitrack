import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const profile = user?.alumni_profile || user?.alumniProfile || {};

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    is_wa_active: user?.is_wa_active ?? true,
    // Alumni fields
    graduation_year: profile?.graduation_year || new Date().getFullYear(),
    nisn: user?.nisn || '',
    current_status: profile?.current_status || 'mahasiswa',
    campus_name: profile?.campus_name || '',
    major_name: profile?.major_name || '',
    company_name: profile?.company_name || '',
    job_title: profile?.job_title || '',
    // Password optional
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const prof = user?.alumni_profile || user?.alumniProfile || {};
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        is_wa_active: user.is_wa_active ?? true,
        graduation_year: prof.graduation_year || prev.graduation_year,
        nisn: user.nisn || prev.nisn,
        current_status: prof.current_status || prev.current_status,
        campus_name: prof.campus_name || '',
        major_name: prof.major_name || '',
        company_name: prof.company_name || '',
        job_title: prof.job_title || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone_number: formData.phone_number,
        is_wa_active: formData.is_wa_active,
        graduation_year: parseInt(formData.graduation_year),
        nisn: formData.nisn,
        current_status: formData.current_status,
        campus_name: formData.campus_name || null,
        major_name: formData.major_name || null,
        company_name: formData.company_name || null,
        job_title: formData.job_title || null,
      };

      if (formData.password) {
        if (formData.password !== formData.password_confirmation) {
          toast.error('Konfirmasi kata sandi baru tidak cocok.');
          setSaving(false);
          return;
        }
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
        if (!formData.current_password) {
          toast.error('Masukkan kata sandi saat ini untuk mengubah kata sandi.');
          setSaving(false);
          return;
        }
        payload.current_password = formData.current_password;
      }

      await updateProfile(payload);
      toast.success('Profil berhasil diperbarui!');
      setFormData((prev) => ({
        ...prev,
        current_password: '',
        password: '',
        password_confirmation: '',
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan perubahan profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
          Pengaturan Profil & Akun
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Perbarui data pribadi dan rekam jejak karir/studi Anda untuk integrasi data alumni SMAN 1 Talang Padang
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Basic Info */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8', marginBottom: '1.25rem' }}>
            👤 Data Identitas Utama
          </h3>

          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kata Sandi Saat Ini</label>
              <input
                type="password"
                name="current_password"
                className="form-input"
                placeholder="Wajib jika mengganti kata sandi"
                value={formData.current_password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nomor WhatsApp Aktif</label>
              <input
                type="text"
                name="phone_number"
                className="form-input"
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Alamat Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* WA Active toggle */}
          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f1f5f9' }}>
                Terima Notifikasi Info Karir via WhatsApp
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Dapatkan pesan rekomendasi lowongan pekerjaan, beasiswa, dan reminder tracer otomatis dari sekolah.
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
              <input
                type="checkbox"
                name="is_wa_active"
                checked={formData.is_wa_active}
                onChange={handleChange}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: formData.is_wa_active ? '#6366f1' : '#334155',
                  borderRadius: '24px',
                  transition: '0.3s',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: formData.is_wa_active ? '26px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.3s',
                  }}
                />
              </span>
            </label>
          </div>
        </div>

        {/* Alumni Details */}
        {user?.role === 'alumni' && (
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '1.25rem' }}>
              🎓 Riwayat Lulusan & Karir
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">NISN (10 Digit)</label>
                <input
                  type="text"
                  name="nisn"
                  maxLength={10}
                  className="form-input"
                  value={formData.nisn}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tahun Kelulusan</label>
                <input
                  type="number"
                  name="graduation_year"
                  className="form-input"
                  value={formData.graduation_year}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Status Aktivitas Saat Ini</label>
              <select
                name="current_status"
                className="form-input form-select"
                value={formData.current_status}
                onChange={handleChange}
              >
                <option value="mahasiswa">Melanjutkan Studi (Mahasiswa)</option>
                <option value="bekerja">Bekerja di Perusahaan / Instansi</option>
                <option value="wirausaha">Membuka Usaha / Wirausaha</option>
                <option value="gap_year">Gap Year / Persiapan</option>
                <option value="belum_kerja">Belum Bekerja</option>
              </select>
            </div>

            {formData.current_status === 'mahasiswa' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nama Universitas / Perguruan Tinggi</label>
                  <input
                    type="text"
                    name="campus_name"
                    className="form-input"
                    placeholder="Contoh: Universitas Lampung"
                    value={formData.campus_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Program Studi / Jurusan</label>
                  <input
                    type="text"
                    name="major_name"
                    className="form-input"
                    placeholder="Contoh: Teknik Informatika"
                    value={formData.major_name}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {(formData.current_status === 'bekerja' || formData.current_status === 'wirausaha') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nama Perusahaan / Bisnis</label>
                  <input
                    type="text"
                    name="company_name"
                    className="form-input"
                    placeholder="Contoh: PT Telkom / Toko Mandiri"
                    value={formData.company_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Jabatan / Posisi</label>
                  <input
                    type="text"
                    name="job_title"
                    className="form-input"
                    placeholder="Contoh: Software Engineer / Owner"
                    value={formData.job_title}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Change Password */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24', marginBottom: '1.25rem' }}>
            🔒 Ganti Kata Sandi (Opsional)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kata Sandi Baru</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Kosongkan bila tidak diubah"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Konfirmasi Kata Sandi Baru</label>
              <input
                type="password"
                name="password_confirmation"
                className="form-input"
                placeholder="Ulangi kata sandi baru"
                value={formData.password_confirmation}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={saving}
          >
            {saving ? 'Menyimpan Perubahan...' : 'Simpan Pembaruan Profil 💾'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
