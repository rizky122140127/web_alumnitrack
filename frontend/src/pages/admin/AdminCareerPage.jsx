import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const AdminCareerPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'magang',
    company_or_institution: '',
    description: '',
    registration_link: '',
  });

  const toast = useToast();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/career-posts${params}`);
      const data = res.data?.data || res.data || [];
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching admin career posts:', err);
      toast.error('Gagal mengambil daftar postingan karir.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [statusFilter]);

  const handleUpdateStatus = async (postId, newStatus) => {
    try {
      await api.put(`/career-posts/${postId}`, { status: newStatus });
      toast.success(
        newStatus === 'approved'
          ? 'Lowongan disetujui & antrean WhatsApp Targeted Push berhasil dibuat!'
          : 'Status lowongan diperbarui.'
      );
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status lowongan.');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Yakin ingin menghapus postingan ini?')) return;

    try {
      await api.delete(`/career-posts/${postId}`);
      toast.success('Postingan karir berhasil dihapus.');
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus postingan.');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/career-posts', formData);
      toast.success('Lowongan resmi BK berhasil dibuat dan disiarkan ke alumni via WA Gateway!');
      setModalOpen(false);
      setFormData({
        title: '',
        category: 'magang',
        company_or_institution: '',
        description: '',
        registration_link: '',
      });
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat postingan karir.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Moderasi Karir & Targeted Push WhatsApp
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Verifikasi info lowongan dan sebarkan notifikasi otomatis ke nomor WhatsApp alumni sasaran
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select
              className="form-input form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="">Semua Status</option>
              <option value="pending">Menunggu (Pending)</option>
              <option value="approved">Disetujui (Approved)</option>
              <option value="rejected">Ditolak (Rejected)</option>
            </select>

            <button onClick={() => setModalOpen(true)} className="btn btn-primary">
              ➕ Buat Info Resmi BK
            </button>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <Spinner text="Memuat daftar lowongan karir..." />
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Tidak ada postingan karir untuk status yang dipilih.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Judul Posisi & Perusahaan</th>
                  <th>Kategori</th>
                  <th>Pengirim</th>
                  <th>Status Moderasi</th>
                  <th style={{ textAlign: 'right' }}>Aksi Moderasi</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{post.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#818cf8' }}>
                        🏢 {post.company_or_institution}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          maxWidth: '400px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px',
                        }}
                      >
                        {post.description}
                      </div>
                    </td>
                    <td>
                      <Badge variant={post.category}>{post.category}</Badge>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        {post.author?.name || 'Admin BK'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {post.created_at ? new Date(post.created_at).toLocaleDateString('id-ID') : ''}
                      </div>
                    </td>
                    <td>
                      <Badge variant={post.status}>{post.status}</Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {post.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(post.id, 'approved')}
                              className="btn btn-primary btn-sm"
                              title="Setujui dan picu WA Targeted Push ke alumni sasaran"
                            >
                              ✅ Setujui & Push WA
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(post.id, 'rejected')}
                              className="btn btn-secondary btn-sm"
                              title="Tolak postingan"
                            >
                              ❌ Tolak
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="btn btn-danger btn-sm"
                          title="Hapus lowongan"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add Official Post */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Buat Lowongan Resmi & Siarkan ke WhatsApp"
        maxWidth="600px"
      >
        <form onSubmit={handleCreatePost}>
          <div className="form-group">
            <label className="form-label">Judul Lowongan / Posisi *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Rekrutmen Khusus Alumni SMAN 1 Talang Padang"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kategori *</label>
              <select
                className="form-input form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="magang">Magang (Target: Mahasiswa/Gap Year)</option>
                <option value="full_time">Full Time (Target: Belum Kerja)</option>
                <option value="part_time">Part Time (Target: Mahasiswa)</option>
                <option value="beasiswa">Beasiswa (Target: Mahasiswa/Gap Year)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Instansi / Perusahaan *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: BUMN / Dinas Pendidikan"
                value={formData.company_or_institution}
                onChange={(e) => setFormData({ ...formData, company_or_institution: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi & Syarat Kualifikasi *</label>
            <textarea
              rows={4}
              className="form-input form-textarea"
              placeholder="Tuliskan rincian persyaratan, batas waktu, dan benefit..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Link Pendaftaran (URL)</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://..."
              value={formData.registration_link}
              onChange={(e) => setFormData({ ...formData, registration_link: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Menyiarkan...' : 'Publikasikan & Siarkan WA 🚀'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCareerPage;
