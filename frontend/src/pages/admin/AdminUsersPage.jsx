import React, { useCallback, useEffect, useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const initialForm = {
  name: '',
  email: '',
  phone_number: '',
  password: '',
  password_confirmation: '',
};

const AdminUsersPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const toast = useToast();

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin-users');
      setAdmins(response.data?.data || []);
    } catch (error) {
      console.error('Error loading administrator accounts:', error);
      toast.error('Gagal memuat daftar admin.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin-users', {
        ...formData,
        email: formData.email || null,
      });
      toast.success('Akun admin berhasil ditambahkan.');
      setModalOpen(false);
      setFormData(initialForm);
      await fetchAdmins();
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const firstError = validationErrors ? Object.values(validationErrors)[0]?.[0] : null;
      toast.error(firstError || error.response?.data?.message || 'Gagal menambahkan akun admin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Pengelola Admin</h1>
            <p style={{ marginTop: '0.35rem' }}>
              Tambahkan akun admin yang berwenang mengakses panel administrasi.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Tambah Admin
          </button>
        </div>
      </section>

      <section className="card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <Spinner text="Memuat daftar admin..." />
        ) : admins.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Belum ada akun admin.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Admin</th>
                  <th>Email</th>
                  <th>Nomor WhatsApp</th>
                  <th>Hak Akses</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.name}</td>
                    <td>{admin.email || '-'}</td>
                    <td>{admin.phone_number}</td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><ShieldCheck size={15} /> Admin</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Akun Admin">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-name">Nama lengkap *</label>
            <input id="admin-name" className="form-input" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required maxLength={255} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-phone">Nomor WhatsApp *</label>
            <input id="admin-phone" className="form-input" value={formData.phone_number} onChange={(event) => setFormData({ ...formData, phone_number: event.target.value })} required maxLength={30} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">Email</label>
            <input id="admin-email" type="email" className="form-input" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} maxLength={255} />
          </div>
          <div className="admin-user-password-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">Password (minimal 8 karakter) *</label>
              <input id="admin-password" type="password" className="form-input" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} required minLength={8} autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-password-confirmation">Konfirmasi password *</label>
              <input id="admin-password-confirmation" type="password" className="form-input" value={formData.password_confirmation} onChange={(event) => setFormData({ ...formData, password_confirmation: event.target.value })} required minLength={8} autoComplete="new-password" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Plus size={15} /> {saving ? 'Menyimpan...' : 'Tambah Admin'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
